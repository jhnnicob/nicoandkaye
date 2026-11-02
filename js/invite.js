(() => {
  const roles = new Set(['Best Man', 'Maid of Honor', 'Bridesmaid', 'Groomsman', 'Principal Sponsor', 'Principal Sponsors']);
  const variants = new Set(['bow-tie', 'emerald-dress', 'bouquet', 'rings-olive', 'rings-flowers', 'rings-botanical', 'rings-ivory']);
  const params = new URLSearchParams(window.location.search);
  const identifier = params.get('to');
  const data = window.WEDDING_INVITATIONS;
  const record = identifier && params.getAll('to').length === 1 && data?.invitations &&
    Object.prototype.hasOwnProperty.call(data.invitations, identifier) ? data.invitations[identifier] : null;
  const valid = record && record.urlIdentifier === identifier &&
    typeof record.id === 'string' && record.id &&
    typeof record.recipientName === 'string' && record.recipientName.trim() && roles.has(record.role) &&
    variants.has(record.designVariant) && typeof record.completeLetter === 'string' && record.completeLetter.trim() &&
    typeof record.signature === 'string' && record.signature.trim() &&
    typeof record.responseQuestion === 'string' && record.responseQuestion.trim();
  const parts = valid ? record.completeLetter.replace(/\r\n?/g, '\n').trim().split(/\n\n+/) : [];
  if (!valid || parts.length < 3 || !parts[0].startsWith('Dear ') || parts[parts.length - 1] !== record.signature) {
    document.getElementById('invitation-error').hidden = false;
    return;
  }
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  document.body.dataset.design = record.designVariant;
  text('envelope-recipient', record.recipientName);
  text('letter-title', parts[0]);
  text('invitation-question', record.responseQuestion);

  // Only these fixed, code-owned illustrations enter innerHTML. Letter data is plain text.
  const branch = '<g class="art-branch"><path d="M19 96c15-30 25-49 48-69m-29 40c-16-1-21-10-19-20 12 1 19 8 19 20Zm11-17c-3-14 2-22 13-28 4 12-1 22-13 28Zm-3 8c14-3 23 1 28 11-14 5-24 1-28-11Z"/><path d="M161 96c-15-30-25-49-48-69m29 40c16-1 21-10 19-20-12 1-19 8-19 20Zm-11-17c3-14-2-22-13-28-4 12 1 22 13 28Zm3 8c-14-3-23 1-28 11 14 5 24 1 28-11Z"/></g>';
  const flower = (x, y) => `<g class="art-flower" transform="translate(${x} ${y})"><ellipse cy="-6" rx="4" ry="7"/><ellipse cy="-6" rx="4" ry="7" transform="rotate(72)"/><ellipse cy="-6" rx="4" ry="7" transform="rotate(144)"/><ellipse cy="-6" rx="4" ry="7" transform="rotate(216)"/><ellipse cy="-6" rx="4" ry="7" transform="rotate(288)"/><circle r="2"/></g>`;
  const flowers = flower(42, 66) + flower(139, 72) + flower(130, 39);
  const rings = '<g class="art-rings"><ellipse cx="73" cy="63" rx="26" ry="31" transform="rotate(-23 73 63)"/><ellipse cx="106" cy="63" rx="26" ry="31" transform="rotate(23 106 63)"/><path d="m61 30 6-10h12l7 10-13 10-12-10Zm0 0h25m-19-10 6 20 6-20"/></g>';
  const bow = '<g class="art-bow"><path d="m82 53-44-19c-8 12-8 34 0 46l44-19m16-8 44-19c8 12 8 34 0 46L98 61"/><rect x="81" y="48" width="18" height="19" rx="4"/><path class="art-bow-detail" d="m41 41 35 15-35 17m98-32-35 15 35 17"/></g><path class="art-gold-line" d="M39 92h102"/>';
  const dress = '<path class="art-dress" d="M77 16h7v14c3 7 9 7 12 0V16h7l5 25-12 19c4 16 12 33 21 48-17 5-37 5-54 0 9-15 17-32 21-48L72 41l5-25Z"/><path class="art-gold-line" d="M84 60h12m-5 10 7 31"/>';
  const bouquet = '<g class="art-branch"><path d="m77 99 14-46 15 46m-18-14-21-32m28 32 23-32m-30 15c-14-2-21-10-21-21 14 1 22 9 21 21Zm9-2c14-2 22-10 22-21-14 1-22 9-22 21Z"/><path d="m79 87 21-1m-18 2-7 16m22-17 10 17"/></g>' + flower(70, 43) + flower(90, 31) + flower(111, 44) + flower(90, 54);
  let art;
  if (record.designVariant === 'bow-tie') art = bow;
  else if (record.designVariant === 'emerald-dress') art = dress + flower(44, 83) + flower(137, 85);
  else if (record.designVariant === 'bouquet') art = bouquet;
  else art = branch + rings + (record.designVariant === 'rings-flowers' ? flowers : '');
  document.getElementById('letter-illustration').innerHTML = `<svg viewBox="0 0 180 120" focusable="false">${art}</svg>`;

  // Optional emphasis is rendered as text and strong nodes, never HTML.
  const appendLetterText = (element, value) => {
    const phrases = Array.isArray(record.emphasis)
      ? record.emphasis.filter(phrase => typeof phrase === 'string' && phrase.length > 0) : [];
    let remaining = value;
    while (remaining) {
      const matches = phrases.map(phrase => ({ phrase, index: remaining.indexOf(phrase) }))
        .filter(match => match.index >= 0).sort((a, b) => a.index - b.index);
      if (!matches.length) {
        element.appendChild(document.createTextNode(remaining));
        break;
      }
      const { phrase, index } = matches[0];
      element.appendChild(document.createTextNode(remaining.slice(0, index)));
      const strong = document.createElement('strong');
      strong.textContent = phrase;
      element.appendChild(strong);
      remaining = remaining.slice(index + phrase.length);
    }
  };

  const copy = document.getElementById('letter-copy');
  parts.slice(1, -1).forEach(paragraph => {
    const lines = paragraph.split('\n');
    if (lines.every(line => line.startsWith('\u2022 '))) {
      const list = document.createElement('ul');
      lines.forEach(line => {
        const item = document.createElement('li');
        item.textContent = line.slice(2);
        list.appendChild(item);
      });
      copy.appendChild(list);
    } else {
      const p = document.createElement('p');
      appendLetterText(p, paragraph);
      copy.appendChild(p);
    }
  });
  const signature = document.getElementById('letter-signature');
  const signatureLines = record.signature.split('\n');
  const signoff = document.createElement('span');
  signoff.className = 'invitation-signoff';
  signoff.textContent = signatureLines.slice(0, -1).join('\n');
  const signer = document.createElement('span');
  signer.className = 'invitation-signer';
  appendLetterText(signer, signatureLines[signatureLines.length - 1]);
  signature.append(signoff, document.createTextNode('\n'), signer);
  document.getElementById('invitation-experience').hidden = false;

  const open = document.getElementById('invitation-open');
  const letter = document.getElementById('invitation-letter');
  open.addEventListener('click', () => {
    if (open.disabled) return;
    open.disabled = true;
    open.setAttribute('aria-expanded', 'true');
    document.getElementById('invitation-envelope').classList.add('is-open');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      letter.hidden = false;
      document.getElementById('invitation-envelope-area').hidden = true;
      document.getElementById('letter-title').focus({ preventScroll: true });
      letter.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, reducedMotion ? 0 : 850);
  });

  const contact = data.responseContact;
  const address = typeof contact?.address === 'string' ? contact.address.trim() : '';
  const configured = contact?.method === 'email' && /^[a-zA-Z0-9.!$'*+\/=_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(address);
  text('invitation-contact-note', configured
    ? 'Choose a reply to prepare an email. Review it and press Send in your email app. This website does not send or save your response.'
    : '');
  ['accept', 'decline'].forEach(response => {
    const link = document.getElementById(`invitation-${response}`);
    if (!configured) return;
    const decision = response === 'accept' ? 'accept' : 'decline';
    const subject = `Wedding role reply: ${record.role} - ${record.recipientName}`;
    const body = `Hello ${record.sender},\n\nI would like to ${decision} your invitation.\nRole: ${record.role}\nFrom: ${record.recipientName}\n\nThis is my role response; my wedding attendance RSVP is separate.`;
    link.href = `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    link.removeAttribute('aria-disabled');
    link.addEventListener('click', () => {
      text('invitation-response-status', `${record.recipientName}, your email app may open with your ${response === 'accept' ? 'acceptance' : 'decline'} message. Please send it there. Your response has not been recorded by this website.`);
    });
  });
})();
