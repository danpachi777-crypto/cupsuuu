import { cupFor } from './model.mjs';
import { readInputs, inputHash } from './navigation.mjs';

const $ = id => document.getElementById(id);
const form = $('calculator-form');
const button = form.querySelector('button[type=submit]');
let submitting = false;
let navigationTimer;
const restored = readInputs(location.hash);
if (restored) {
  $('height').value = restored.height;
  $('weight').value = restored.weight;
  form.elements.standard.value = restored.standard;
}

function validate(showError = false) {
  for (const id of ['height', 'weight']) {
    const el = $(id);
    el.removeAttribute('aria-invalid');
    if (el.value.trim() === '' || !Number.isFinite(el.valueAsNumber) || el.valueAsNumber < Number(el.min) || el.valueAsNumber > Number(el.max) || el.validity.stepMismatch) {
      if (showError) {
        el.setAttribute('aria-invalid', 'true');
        $('form-error').textContent = `${id === 'height' ? '身長' : '体重'}は${el.min}〜${el.max}${id === 'height' ? 'cm' : 'kg'}の数字で入力してください（小数1桁まで）。`;
        $('form-error').hidden = false;
        el.focus();
      }
      return false;
    }
  }
  $('form-error').hidden = true;
  return true;
}

function updateInput() {
  const height = $('height').valueAsNumber;
  if (Number.isFinite(height) && height >= 120 && height <= 230) {
    $('height-range').value = String(height);
    $('height-range').style.setProperty('--range-progress', `${(height - 120) / 110 * 100}%`);
    $('weight-help').textContent = `この身長の基準体重は${Number((height - 110).toFixed(1))}kg。軽くても重くても体型が変化します。`;
  }
  for (const row of document.querySelectorAll('#reference-rows tr')) {
    const active = height >= Number(row.dataset.min) && height < Number(row.dataset.max);
    row.classList.toggle('active-row', active);
    if (active) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
  }
}

const boundaries = [0, 150, 155, 160, 165, 170, 175, 178, 180, 185, 188, 190];
for (let i = 0; i < boundaries.length; i++) {
  const min = boundaries[i];
  const max = boundaries[i + 1] ?? Infinity;
  const row = document.createElement('tr');
  row.dataset.min = String(min);
  row.dataset.max = String(max);
  const header = document.createElement('th');
  header.scope = 'row';
  header.textContent = min === 0 ? '150cm未満' : max === Infinity ? `${min}cm以上` : `${min}cm以上〜${max}cm未満`;
  row.append(header);
  for (const ref of ['image1', 'image2']) {
    const cell = document.createElement('td');
    cell.textContent = cupFor(min || 120, ref).cup;
    row.append(cell);
  }
  $('reference-rows').append(row);
}

form.addEventListener('input', event => {
  if (event.target.id === 'height-range') $('height').value = event.target.value;
  updateInput();
  if (!$('form-error').hidden) validate(true);
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (submitting || !validate(true)) return;
  submitting = true;
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  $('loading-screen').hidden = false;
  const hash = inputHash({ height: $('height').valueAsNumber, weight: $('weight').valueAsNumber, standard: form.elements.standard.value });
  navigationTimer = setTimeout(() => location.assign(`./result.html${hash}`), 1000);
});
window.addEventListener('pageshow', () => {
  clearTimeout(navigationTimer);
  submitting = false;
  button.disabled = false;
  form.removeAttribute('aria-busy');
  $('loading-screen').hidden = true;
  updateInput();
});
updateInput();
