(() => {
  const overlay = document.getElementById('contact-overlay');
  const closeButton = document.getElementById('contact-close');
  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  const error = document.getElementById('contact-error');
  const submit = document.getElementById('contact-submit');
  const submitLabel = document.getElementById('contact-submit-label');
  const background = document.querySelectorAll('body > header, body > main, body > footer, body > .skip-link');
  const WEB3FORMS_ACCESS_KEY = '3181ff54-df0a-4280-9f85-33c11d4b064e';
  let opener;
  let submitting = false;
  let previousOverflow = '';
  let requestId = 0;

  function open(event) {
    opener = event.currentTarget;
    previousOverflow = document.body.style.overflow;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    background.forEach(node => { node.inert = true; });
    closeButton.focus();
  }
  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = previousOverflow;
    background.forEach(node => { node.inert = false; });
    requestId++;
    submitting = false;
    form.reset();
    form.hidden = false;
    success.hidden = true;
    error.hidden = true;
    submit.disabled = false;
    submitLabel.textContent = 'Submit inquiry';
    opener?.focus();
  }
  document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', open));
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])')].filter(node => node.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    submitting = true;
    const thisRequest = ++requestId;
    submit.disabled = true;
    submitLabel.textContent = 'Sending…';
    error.hidden = true;
    const fields = new FormData(form);
    const topic = fields.get('topic') || 'General inquiry';
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `[${topic}] ${fields.get('name') || fields.get('email')} — loka.inc`,
      from_name: fields.get('name') || 'loka.inc visitor',
      email: fields.get('email'),
      message: `Topic: ${topic}\nOrganization: ${fields.get('organization') || ''}\n\n${fields.get('message') || ''}`,
    };
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (thisRequest !== requestId) return;
      if (!response.ok || !data.success) throw new Error(data.message || 'Something went wrong. Please try again.');
      document.getElementById('contact-success-email').textContent = payload.email;
      form.hidden = true;
      success.hidden = false;
      closeButton.focus();
    } catch (err) {
      if (thisRequest !== requestId) return;
      error.textContent = err.message || 'Network error. Please try again.';
      error.hidden = false;
    } finally {
      if (thisRequest === requestId) {
        submitting = false;
        submit.disabled = false;
        submitLabel.textContent = 'Submit inquiry';
      }
    }
  });
})();
