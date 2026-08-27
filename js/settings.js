import {
  getSettings,
  saveSettings
} from './storage.js';
import './reader-fix.js';
import './contact.js';
import {
  $
} from './ui.js';
let settings = getSettings();

function apply() {
  document.body.classList.toggle('dark', settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches));
  document.documentElement.style.setProperty('--reader-size', `${settings.font}px`);
  document.documentElement.dataset.spacing = settings.spacing;
  document.documentElement.dataset.width = settings.width;
  const output = $('[data-font-output]');
  if (output) output.textContent = `${settings.font}px`;
  for (const [selector, key] of [
      ['[data-font-setting]', 'font'],
      ['[data-spacing-setting]', 'spacing'],
      ['[data-width-setting]', 'width'],
      ['[data-theme-setting]', 'theme']
    ]) {
    const node = $(selector);
    if (node) node.value = settings[key]
  }
}
export function initSettings() {
  apply();
  const dialog = $('[data-settings-dialog]');
  document.querySelectorAll('[data-open-settings]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  for (const [selector, key] of [
      ['[data-font-setting]', 'font'],
      ['[data-spacing-setting]', 'spacing'],
      ['[data-width-setting]', 'width'],
      ['[data-theme-setting]', 'theme']
    ]) {
    const node = $(selector);
    if (node) node.addEventListener('input', () => {
      settings = {
        ...settings,
        [key]: key === 'font' ? Number(node.value) : node.value
      };
      saveSettings(settings);
      apply()
    })
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
    settings = {
      ...settings,
      theme: document.body.classList.contains('dark') ? 'light' : 'dark'
    };
    saveSettings(settings);
    apply()
  }))
}
