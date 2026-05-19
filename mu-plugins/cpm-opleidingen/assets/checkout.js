/* CPM Opleidingen Checkout — progressive enhancement.
 * - Re-render schedule + plan cards wanneer klant van termijn wisselt of optionele addon aan/uit zet.
 * - Submit via fetch zodat we netjes errors/redirect kunnen tonen.
 */

(function () {
	'use strict';

	const form = document.querySelector('[data-cpm-form="1"]');
	if (!form) return;

	const previewNode = document.getElementById('cpm-opl-preview-data');
	const scheduleEl = form.querySelector('[data-cpm-schedule]');
	const feedbackEl = form.querySelector('[data-cpm-feedback]'); // niet optioneel bij normale pagina-setup
	const submitBtn = form.querySelector('button[type="submit"]');
	const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;
	const submitDefaultLabel = submitLabel ? submitLabel.textContent : (submitBtn ? submitBtn.textContent : '');
	const addonCb = form.querySelector('input[name="addon_combi"]');

	let preview = {};
	try {
		preview = JSON.parse(previewNode.textContent || '{}');
	} catch (e) {
		preview = {};
	}

	if (!preview.base && preview['1']) {
		preview = { base: preview };
	}

	const activeLayer = () => {
		const useAddon = addonCb && addonCb.checked && preview.with_addon;
		return useAddon ? preview.with_addon : preview.base;
	};

	const BTW = 1.21;
	const exclFromIncl = (incl) => Math.round(Number(incl) / BTW);

	const fmtEUR = (cents) =>
		'\u20AC\u00A0' + (Number(cents) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const fmtExclEUR = (inclCents) => `${fmtEUR(exclFromIncl(inclCents))} excl. btw`;

	const MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
	const fmtDateNL = (iso) => {
		if (!iso) return '';
		const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (!m) return iso;
		return parseInt(m[3], 10) + ' ' + MONTHS_NL[parseInt(m[2], 10) - 1] + ' ' + m[1];
	};

	const renderSchedule = () => {
		const layer = activeLayer();
		const n = form.querySelector('input[name="num_termijnen"]:checked');
		if (!scheduleEl || !layer || !n) return;
		const plan = layer[n.value];
		if (!plan || !plan.length) return;
		const rows = plan.map((row) =>
			`<tr>
				<td>${row.is_deposit ? 'Aanbetaling' : 'Termijn ' + row.termijn}</td>
				<td>${fmtDateNL(row.due_date)}</td>
				<td>${fmtExclEUR(row.amount_cents)}</td>
			</tr>`
		).join('');
		scheduleEl.innerHTML =
			`<table class="cpm-opl-table">
				<thead><tr><th>Termijn</th><th>Vervalt</th><th>Bedrag</th></tr></thead>
				<tbody>${rows}</tbody>
			</table>`;
	};

	const updatePlanCards = () => {
		const layer = activeLayer();
		if (!layer) return;
		form.querySelectorAll('.cpm-opl-plan[data-cpm-plan-n]').forEach((lab) => {
			const n = lab.getAttribute('data-cpm-plan-n');
			const plan = layer[n];
			const card = lab.querySelector('.cpm-opl-plan-card');
			if (!plan || !plan.length || !card) return;
			const first = plan[0].amount_cents;
			const last = plan[plan.length - 1].amount_cents;
			const num = parseInt(n, 10);
			const amtEl = card.querySelector('.cpm-opl-plan-card__amount');
			const restEl = card.querySelector('.cpm-opl-plan-card__rest');
			if (amtEl) amtEl.textContent = fmtExclEUR(first);
			if (restEl) {
				if (num === 1) {
					restEl.innerHTML = 'Geen vervolg\u00ADtermijnen';
				} else {
					restEl.innerHTML = `Daarna ${num - 1}&times; ${fmtExclEUR(last)}`;
				}
			}
		});
	};

	const updateInvestment = () => {
		const wrap = document.querySelector('.cpm-opl-investment[data-cpm-inv-base]');
		if (!wrap) return;
		const base = Number(wrap.dataset.cpmInvBase || 0);
		const addon = Number(wrap.dataset.cpmInvAddon || 0);
		const cb = form.querySelector('input[name="addon_combi"]');
		const exclLabel = (cents) => `${fmtEUR(cents)} excl. btw`;

		if (!addon || !cb) {
			wrap.textContent = exclLabel(base);
			return;
		}
		if (cb.checked) {
			wrap.innerHTML =
				`${exclLabel(base + addon)}<br>` +
				`<span class="cpm-opl-investment__note">(${exclLabel(base)} opleiding + ${exclLabel(addon)} optionele vervolgdag)</span>`;
		} else {
			wrap.textContent = exclLabel(base);
		}
	};

	const syncAll = () => {
		updatePlanCards();
		renderSchedule();
		updateInvestment();
	};

	const setSubmit = (label, busy) => {
		if (!submitBtn) return;
		if (submitLabel) {
			submitLabel.textContent = label;
		} else {
			submitBtn.textContent = label;
		}
		submitBtn.disabled = !!busy;
	};

	form.addEventListener('change', (e) => {
		if (!e.target) return;
		const t = e.target;
		if (t.name === 'num_termijnen') renderSchedule();
		if (t.name === 'addon_combi') syncAll();
	});

	syncAll();

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		if (!feedbackEl) return;
		feedbackEl.textContent = '';
		feedbackEl.className = 'cpm-opl-feedback';

		const fd = new FormData(form);
		const payload = {};
		fd.forEach((v, k) => {
			if (k !== 'addon_combi') payload[k] = v;
		});
		payload.cohort_id = Number(form.dataset.cohortId);
		payload.num_termijnen = Number(payload.num_termijnen || 1);
		const acb = form.querySelector('input[name="addon_combi"]');
		payload.addon_combi = acb && acb.checked ? true : false;

		setSubmit('Even geduld\u2026', true);

		try {
			const res = await fetch(window.CPM_OPL.rest_root + '/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.CPM_OPL.nonce,
				},
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok || !data.ok) {
				const msg = (data && (data.message || data.detail)) || 'Er ging iets mis. Probeer opnieuw.';
				feedbackEl.textContent = msg;
				feedbackEl.classList.add('is-error');
				setSubmit(submitDefaultLabel, false);
				return;
			}
			feedbackEl.textContent = 'Inschrijving aangemaakt \u2014 je wordt doorgestuurd naar Mollie\u2026';
			feedbackEl.classList.add('is-success');
			window.location.href = data.redirect_url;
		} catch (err) {
			feedbackEl.textContent = 'Netwerkfout: ' + (err && err.message || err);
			feedbackEl.classList.add('is-error');
			setSubmit(submitDefaultLabel, false);
		}
	});
})();
