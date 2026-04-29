/* CPM Opleidingen Checkout — progressive enhancement.
 * - Re-render schedule wanneer klant een ander aantal termijnen kiest.
 * - Submit via fetch zodat we netjes errors/redirect kunnen tonen.
 * Geen build-step nodig. ES2017+. */

(function () {
	'use strict';

	const form = document.querySelector('[data-cpm-form="1"]');
	if (!form) return;

	const previewNode = document.getElementById('cpm-opl-preview-data');
	const scheduleEl  = form.querySelector('[data-cpm-schedule]');
	const feedbackEl  = form.querySelector('[data-cpm-feedback]');
	const submitBtn   = form.querySelector('button[type="submit"]');
	const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;
	const submitDefaultLabel = submitLabel ? submitLabel.textContent : (submitBtn ? submitBtn.textContent : '');

	let preview = {};
	try { preview = JSON.parse(previewNode.textContent || '{}'); } catch (e) { preview = {}; }

	const fmtEUR = (cents) =>
		'\u20AC\u00A0' + (Number(cents) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
	const fmtDateNL = (iso) => {
		if (!iso) return '';
		const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (!m) return iso;
		return parseInt(m[3], 10) + ' ' + MONTHS_NL[parseInt(m[2], 10) - 1] + ' ' + m[1];
	};

	const renderSchedule = (n) => {
		if (!scheduleEl) return;
		const plan = preview[n];
		if (!plan) return;
		const rows = plan.map((row) =>
			`<tr>
				<td>${row.is_deposit ? 'Aanbetaling' : 'Termijn ' + row.termijn}</td>
				<td>${fmtDateNL(row.due_date)}</td>
				<td>${fmtEUR(row.amount_cents)}</td>
			</tr>`
		).join('');
		scheduleEl.innerHTML =
			`<table class="cpm-opl-table">
				<thead><tr><th>Termijn</th><th>Vervalt</th><th>Bedrag</th></tr></thead>
				<tbody>${rows}</tbody>
			</table>`;
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
		if (e.target && e.target.name === 'num_termijnen') {
			renderSchedule(e.target.value);
		}
	});

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		feedbackEl.textContent = '';
		feedbackEl.className = 'cpm-opl-feedback';

		const fd = new FormData(form);
		const payload = {};
		fd.forEach((v, k) => { payload[k] = v; });
		payload.cohort_id     = Number(form.dataset.cohortId);
		payload.num_termijnen = Number(payload.num_termijnen || 1);

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
