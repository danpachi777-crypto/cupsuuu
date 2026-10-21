import { calculate, formatBust } from './model.mjs';
import { celebrityGroups } from './celebrities.mjs';
import { readInputs, inputHash } from './navigation.mjs';

const $ = id => document.getElementById(id);
let copyTimer;
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function sourceLink(label, href) {
  const link = element('a', label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function render() {
  clearTimeout(copyTimer);
  const inputs = readInputs(location.hash);
  $('result-content').hidden = !inputs;
  $('result-error').hidden = Boolean(inputs);
  if (!inputs) return;
  const result = calculate(inputs.height, inputs.weight, inputs.standard);
  for (const link of document.querySelectorAll('.back-input')) link.href = `./index.html${inputHash(inputs)}`;
  $('input-summary').textContent = `${result.height}cm・${result.weight}kgから換算した結果です。`;
  $('result-source').textContent = `${result.height}cm / ${result.weight}kg を換算すると`;
  $('result-reference').textContent = inputs.standard === 'image1' ? '画像1の基準' : '画像2の基準';
  $('cup').textContent = result.cup;
  $('cup').classList.toggle('wide-cup', result.cup.length > 2);
  $('bust').textContent = formatBust(result.bust);
  $('bust').parentElement.classList.toggle('wide-measure', formatBust(result.bust).length > 6);
  $('waist').textContent = result.waist.toFixed(1);
  $('hip').textContent = result.hip.toFixed(1);
  $('underbust').textContent = `${result.underbust.toFixed(1)}cm`;
  $('bmi').textContent = result.bmi.toFixed(1);
  $('weight-reference').textContent = `この身長の基準体重 ${Number(result.referenceWeight.toFixed(1))}kg · ${result.weightDelta === 0 ? '基準と同じ' : `基準から ${result.weightDelta > 0 ? '+' : '−'}${Math.abs(result.weightDelta).toFixed(1)}kg`}`;
  $('other-standard').textContent = `ちなみに、${inputs.standard === 'image1' ? '画像2' : '画像1'}の基準では ${result.alternateCup}カップ`;
  $('copy-label').textContent = '結果をコピー';
  $('copy-fallback').hidden = true;
  renderCelebrities(result);
}

function renderCelebrities(result) {
  const groups = celebrityGroups(result);
  $('catalog-count').textContent = String(groups.catalog.length);
  const closeCount = [...groups.featured, ...groups.more].filter(profile => profile.isClose).length;
  $('reference-message').textContent = closeCount ? `厳密な近さの基準に合う人は${closeCount}名です。参考候補も含め、登録者の中から近い順に15名を表示します。` : '登録者の中から、3サイズの差が小さい順に15名を選びました。厳密な近さの基準に合う人はいないため、予想の参考候補としてご覧ください。';
  $('matching-heading').textContent = '近い順の候補 TOP 5';
  $('matching-empty').hidden = true;
  $('celebrity-matches').hidden = false;
  $('more-matches-section').hidden = groups.more.length === 0;
  renderProfileGroup(groups.featured, 'celebrity-matches', result, 0);
  renderProfileGroup(groups.more, 'celebrity-more', result, groups.featured.length);
  renderProfileGroup(groups.catalog, 'celebrity-catalog', result, 0);
  renderProfileGroup(groups.comedy, 'celebrity-comedy', result, 0);
}

function renderProfileGroup(matches, containerId, result, offset) {
  const container = $(containerId);
  container.replaceChildren();
  matches.forEach((profile, index) => {
    const card = element('article', undefined, `portrait-card${containerId === 'celebrity-matches' ? ' portrait-card-primary' : ''}${profile.isClose ? '' : ' portrait-card-distant'}`);
    const photoLink = sourceLink('', profile.imageSource);
    photoLink.className = 'portrait-photo-link';
    photoLink.setAttribute('aria-label', `${profile.name}の写真の出典（新しいタブで開く）`);
    const photo = document.createElement('img');
    photo.className = 'portrait-photo';
    photo.src = profile.image;
    photo.alt = `${profile.name}の顔写真`;
    photo.width = 240;
    photo.height = 300;
    photo.loading = containerId === 'celebrity-matches' && index < 2 ? 'eager' : 'lazy';
    photo.addEventListener('error', () => {
      photo.hidden = true;
      photoLink.append(element('span', '写真の出典で見る ↗', 'photo-fallback'));
    }, { once: true });
    photoLink.append(photo);
    const content = element('div', undefined, 'portrait-content');
    content.append(element('p', `${String(index + offset + 1).padStart(2, '0')} / ${profile.role}`, 'portrait-rank'));
    content.append(element('h3', profile.name));
    content.append(element('p', profile.cup ? `公表当時 ${profile.cup}カップ` : 'カップ数：公表値未確認', 'profile-cup'));
    content.append(element('span', profile.isClose ? '3サイズが近い候補' : '予想の参考候補・サイズ差あり', `match-tag${profile.isClose ? ' match-tag-close' : ''}`));
    const table = document.createElement('table');
    table.className = 'portrait-comparison';
    table.setAttribute('aria-label', `${profile.name}の公表3サイズと換算結果の比較（cm）`);
    const head = document.createElement('thead');
    const header = document.createElement('tr');
    for (const label of ['cm', 'B', 'W', 'H']) { const cell = element('th', label); cell.scope = 'col'; header.append(cell); }
    head.append(header); table.append(head);
    const body = document.createElement('tbody');
    for (const [label, numbers] of [['換算結果', [formatBust(result.bust), result.waist.toFixed(1), result.hip.toFixed(1)]], ['公表値', [profile.bust, profile.waist, profile.hip]]]) {
      const row = document.createElement('tr');
      const title = element('th', label); title.scope = 'row'; row.append(title);
      numbers.forEach(number => row.append(element('td', String(number))));
      body.append(row);
    }
    const gapRow = element('tr', undefined, 'comparison-gap-row');
    const gapTitle = element('th', '差（絶対値）'); gapTitle.scope = 'row'; gapRow.append(gapTitle);
    profile.gaps.forEach(gap => gapRow.append(element('td', gap.toFixed(1), gap > 5 ? 'large-gap' : '')));
    body.append(gapRow);
    table.append(body); content.append(table);
    content.append(element('p', `最大の差 ${profile.maxGap.toFixed(1)}cm / 平均 ${profile.meanGap.toFixed(1)}cm`, 'portrait-difference'));
    content.append(element('p', profile.sourceNote, 'portrait-source-note'));
    if (profile.cup) content.append(element('p', `カップ数：${profile.cupNote}`, 'portrait-source-note'));
    const links = element('div', undefined, 'portrait-sources');
    links.append(sourceLink('3サイズの出典 ↗', profile.source), sourceLink('写真の出典 ↗', profile.imageSource));
    if (profile.cupSource) links.append(sourceLink('カップ数の出典 ↗', profile.cupSource));
    content.append(links);
    card.append(photoLink, content);
    container.append(card);
  });
}

$('copy-result').addEventListener('click', async () => {
  const inputs = readInputs(location.hash);
  if (!inputs) return;
  const result = calculate(inputs.height, inputs.weight, inputs.standard);
  const text = `STYLE SWAP｜${result.height}cm・${result.weight}kg → ${result.cup}カップ相当\nB ${formatBust(result.bust)} / W ${result.waist.toFixed(1)} / H ${result.hip.toFixed(1)} cm\n${$('result-reference').textContent}・女性160cm想定。3サイズは独自モデルのイメージ値です。`;
  try {
    await navigator.clipboard.writeText(text);
    $('copy-label').textContent = 'コピーしました';
    $('live-status').textContent = '換算結果をコピーしました。';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => $('copy-label').textContent = '結果をコピー', 2500);
  } catch {
    $('copy-text').value = text;
    $('copy-fallback').hidden = false;
    $('copy-text').focus();
    $('copy-text').select();
  }
});
window.addEventListener('hashchange', render);
render();
