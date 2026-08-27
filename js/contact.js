const fallback = {
  editor: 'Project editor',
  githubProfile: '',
  whatsappNumber: '',
  whatsappMessage: '',
  issuesURL: ''
};

function whatsappURL(contact) {
  const digits = String(contact.whatsappNumber || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(contact.whatsappMessage || '')}` : '';
}
async function loadContact() {
  let contact = fallback;
  try {
    contact = {
      ...fallback,
      ...(await (await fetch('data/contact.json', {
        cache: 'no-store'
      })).json())
    };
  } catch {}
  document.querySelectorAll('[data-profile-name]').forEach(node => {
    node.textContent = contact.editor;
  });
  document.querySelectorAll('[data-profile-link]').forEach(node => {
    if (contact.githubProfile) node.href = contact.githubProfile;
    else node.hidden = true;
  });
  const whatsapp = whatsappURL(contact);
  document.querySelectorAll('[data-whatsapp]').forEach(node => {
    if (whatsapp) node.href = whatsapp;
    else {
      node.textContent = 'WhatsApp contact pending';
      node.setAttribute('aria-disabled', 'true');
      node.removeAttribute('href');
    }
  });
  document.querySelectorAll('[data-feedback]').forEach(node => {
    if (contact.issuesURL) node.href = `${contact.issuesURL}/new`;
  });
  document.querySelectorAll('[data-correction]').forEach(node => {
    if (contact.issuesURL) node.href = `${contact.issuesURL}/new?labels=correction`;
  });
  const footer = document.querySelector('.site-footer .footer-inner');
  if (footer && !footer.querySelector('[data-feedback]')) {
    const links = [
      [`GitHub · ${contact.editor}`, contact.githubProfile],
      ['Send feedback', contact.issuesURL ? `${contact.issuesURL}/new` : ''],
      ['Report correction', contact.issuesURL ? `${contact.issuesURL}/new?labels=correction` : ''],
      ['Chat with editor', whatsapp],
      ['Usage policy', 'policy.html']
    ];
    links.forEach(([label, href]) => {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = href || '#';
      if (!href) link.setAttribute('aria-disabled', 'true');
      footer.append(link);
    });
  }
}
loadContact();
