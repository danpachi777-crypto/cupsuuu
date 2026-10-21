import { calculate, cupFor, formatBust } from './model.mjs';

const $ = id => document.getElementById(id);
const form = $('calculator-form');
let current = null;
let copyTimer;
const mode = () => form.elements.standard.value;
const number = value => Number.isFinite(value) ? String(value) : '';

function validate(showError = false) {
  for (const id of ['height', 'weight']) {
    const el = $(id);
    el.removeAttribute('aria-invalid');
    if (el.value.trim() === '' || !Number.isFinite(el.valueAsNumber) || el.valueAsNumber < Number(el.min) || el.valueAsNumber > Number(el.max) || el.validity.stepMismatch) {
      const label = id === 'height' ? '身長' : '体重';
      const unit = id === 'height' ? 'cm' : 'kg';
      if (showError) {
        el.setAttribute('aria-invalid', 'true');
        $('form-error').textContent = `${label}は${el.min}〜${el.max}${unit}の数字で入力してください（小数1桁まで）。`;
        $('form-error').hidden = false;
        el.focus();
      }
      return false;
    }
  }
  $('form-error').hidden = true;
  return true;
}

function render() {
  const valid = validate();
  $('result').classList.toggle('pending-result', !valid);
  if (!valid) {
    current = null;
    $('copy-result').disabled = true;
    $('result-source').textContent = '入力途中です · 下の数字は直前の結果';
    return false;
  }
  current = calculate($('height').valueAsNumber, $('weight').valueAsNumber, mode());
  $('copy-result').disabled = false;
  $('copy-fallback').hidden = true;
  $('copy-label').textContent = '結果をコピー';
  clearTimeout(copyTimer);
  $('result-source').textContent = `${number(current.height)}cm / ${number(current.weight)}kg を換算すると`;
  $('result-reference').textContent = mode() === 'image1' ? '画像1の基準' : '画像2の基準';
  $('cup').textContent = current.cup;
  $('cup').classList.toggle('wide-cup', current.cup.length > 2);
  $('bust').textContent = formatBust(current.bust);
  $('bust').parentElement.classList.toggle('wide-measure', formatBust(current.bust).length > 6);
  $('waist').textContent = current.waist.toFixed(1);
  $('hip').textContent = current.hip.toFixed(1);
  $('underbust').textContent = `${current.underbust.toFixed(1)}cm`;
  $('bmi').textContent = current.bmi.toFixed(1);
  $('other-standard').replaceChildren(document.createTextNode(`ちなみに、${mode() === 'image1' ? '画像2' : '画像1'}の基準では `));
  const alternate = document.createElement('strong');
  alternate.textContent = `${current.alternateCup}カップ`;
  $('other-standard').append(alternate);
  $('height-range').value = String(current.height);
  $('height-range').style.setProperty('--range-progress', `${(current.height - 120) / 110 * 100}%`);
  for (const row of document.querySelectorAll('#reference-rows tr')) {
    const active = current.height >= Number(row.dataset.min) && current.height < Number(row.dataset.max);
    row.classList.toggle('active-row', active);
    if(active) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
  }
  return true;
}

function resultText() {
  return `STYLE SWAP｜${current.height}cm・${current.weight}kg → ${current.cup}カップ相当\nB ${formatBust(current.bust)} / W ${current.waist.toFixed(1)} / H ${current.hip.toFixed(1)} cm\n${$('result-reference').textContent}・女性160cm想定。3サイズは独自モデルのイメージ値です。`;
}

const boundaries = [0, 150, 155, 160, 165, 170, 175, 178, 180, 185, 188, 190];
for (let i = 0; i < boundaries.length; i++) {
  const min = boundaries[i];
  const max = boundaries[i + 1] ?? Infinity;
  const row = document.createElement('tr');
  row.dataset.min = String(min);
  row.dataset.max = String(max);
  const label = min === 0 ? '150cm未満' : max === Infinity ? `${min}cm以上` : `${min}cm以上〜${max}cm未満`;
  const header = document.createElement('th');
  header.scope = 'row';
  header.textContent = label;
  row.append(header);
  for(const ref of ['image1', 'image2']) {
    const cell = document.createElement('td');
    cell.textContent = cupFor(min || 120, ref).cup;
    row.append(cell);
  }
  $('reference-rows').append(row);
}

form.addEventListener('input', event => {
  if (event.target.id === 'height-range') $('height').value = event.target.value;
  render();
});
form.addEventListener('change', () => {
  if (render()) $('live-status').textContent = `${current.cup}カップ相当。バスト${formatBust(current.bust)}、ウエスト${current.waist.toFixed(1)}、ヒップ${current.hip.toFixed(1)}センチ。`;
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if(!validate(true) || !render()) return;
  $('live-status').textContent = `${current.height}センチ、${current.weight}キロの結果。${current.cup}カップ相当。バスト${formatBust(current.bust)}、ウエスト${current.waist.toFixed(1)}、ヒップ${current.hip.toFixed(1)}センチ。`;
  $('result').focus({preventScroll: true});
  if (matchMedia('(max-width: 760px)').matches) $('result').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
});
$('copy-result').addEventListener('click', async () => {
  if (!current) return;
  const text = resultText();
  try {
    await navigator.clipboard.writeText(text);
    $('copy-label').textContent = 'コピーしました';
    $('live-status').textContent = '換算結果をコピーしました。';
    copyTimer = setTimeout(() => $('copy-label').textContent = '結果をコピー', 2500);
  } catch {
    $('copy-text').value = text;
    $('copy-fallback').hidden = false;
    $('copy-text').focus();
    $('copy-text').select();
    $('live-status').textContent = '表示した文章を選択してコピーしてください。';
  }
});
render();
