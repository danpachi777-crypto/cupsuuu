import { calculate } from './model.mjs';

export function readInputs(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!['height', 'weight', 'standard'].every(key => params.has(key))) return null;
  const rawHeight = params.get('height');
  const rawWeight = params.get('weight');
  if (!rawHeight.trim() || !rawWeight.trim()) return null;
  const height = Number(rawHeight);
  const weight = Number(rawWeight);
  const standard = params.get('standard');
  if (!['image1', 'image2'].includes(standard) ||
      [height, weight].some(n => !Number.isFinite(n) || Math.abs(n * 10 - Math.round(n * 10)) > 1e-8)) return null;
  try { calculate(height, weight, standard); } catch { return null; }
  return { height, weight, standard };
}

export function inputHash({ height, weight, standard }) {
  return '#' + new URLSearchParams({ height: String(height), weight: String(weight), standard });
}
