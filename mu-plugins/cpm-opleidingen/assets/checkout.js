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

	let preview = {};
	try { preview = JSON.parse(previewNode.textContent || '{}'); } catch (e) { preview = {}; }

	const fmtEUR = (cents) =>
		'€ ' + (Number(cents) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const renderSchedule = (n) => {
		const plan = preview[n];
		if (!plan) return;
		const rows = plan.map((row) =>
			`<tr>
				<td>${row.is_deposit ? 'Aanbetaling' : 'Termijn ' + row.termijn}</td>
				<td>${row.due_date}</td>
				<td style="text-align:right">${fmtEUR(row.amount_cents)}</td>
			</tr>`
		).join('');
		scheduleEl.innerHTML =
			`<table class="cpm-opl-table">
				<thead><tr><th>Termijn</th><th>Vervaldatum</th><th style="text-align:right">Bedrag</th></tr></thead>
				<tbody>${rows}</tbody>
			</table>`;
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

		submitBtn.disabled = true;
		const oldText      = submitBtn.textContent;
		submitBtn.textContent = 'Even geduld…';

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
				submitBtn.disabled = false;
				submitBtn.textContent = oldText;
				return;
			}
			feedbackEl.textContent = 'Inschrijving aangemaakt — je wordt doorgestuurd naar Mollie…';
			feedbackEl.classList.add('is-success');
			window.location.href = data.redirect_url;
		} catch (err) {
			feedbackEl.textContent = 'Netwerkfout: ' + (err && err.message || err);
			feedbackEl.classList.add('is-error');
			submitBtn.disabled = false;
			submitBtn.textContent = oldText;
		}
	});
})();
