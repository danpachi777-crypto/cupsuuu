// Image-based cup mapping and an explicitly fictional body-size model.
export const TABLES = {
  image1: [
    { min: 0, cup: 'AA', diff: [7.5, 7.5] },
    { min: 160, cup: 'A', diff: [10, 10] },
    { min: 165, cup: 'B', diff: [12.5, 12.5] },
    { min: 170, cup: 'C', diff: [15, 15] },
    { min: 178, cup: 'D', diff: [17.5, 17.5] },
    { min: 180, cup: 'E', diff: [20, 20] },
    { min: 185, cup: 'F', diff: [22.5, 22.5] },
    { min: 188, cup: 'G', diff: [25, 25] },
    { min: 190, cup: 'H', diff: [27.5, 27.5] },
  ],
  image2: [
    { min: 0, cup: 'A', diff: [10, 10] },
    { min: 150, cup: 'A', diff: [10, 10] },
    { min: 155, cup: 'A', diff: [10, 10] },
    { min: 160, cup: 'B', diff: [12.5, 12.5] },
    { min: 165, cup: 'B〜C', diff: [12.5, 15] },
    { min: 170, cup: 'D', diff: [17.5, 17.5] },
    { min: 175, cup: 'E', diff: [20, 20] },
    { min: 180, cup: 'F', diff: [22.5, 22.5] },
    { min: 185, cup: 'G〜', diff: [25, null] },
    { min: 190, cup: 'G〜', diff: [25, null] },
  ],
};

export function cupFor(height, mode = 'image1') {
  if (!Number.isFinite(height) || height <= 0 || !TABLES[mode]) throw new RangeError('Invalid height or table');
  return TABLES[mode].findLast(row => height >= row.min);
}

export function calculate(height, weight, mode = 'image1') {
  if (!Number.isFinite(height) || height < 120 || height > 230) throw new RangeError('身長は120〜230cmで入力してください。');
  if (!Number.isFinite(weight) || weight < 30 || weight > 220) throw new RangeError('体重は30〜220kgで入力してください。');
  const bmi = weight / (height / 100) ** 2;
  // User-defined creative baseline, not a medical or population standard.
  const referenceWeight = height - 110;
  const weightDelta = weight - referenceWeight;
  const relativeDeviation = Math.abs(weightDelta) / referenceWeight;
  // Smooth bounded penalty: zero at reference, strictly increasing on either side.
  const penalty = relativeDeviation / (1 + relativeDeviation);
  const lighter = weightDelta < 0;
  // Underweight reduces bust/hip volume without rewarding a tiny waist.
  // Overweight increases waist faster than bust/hip. Both reduce waist definition.
  const underbust = 72 + (lighter ? -16 : 40) * penalty;
  const waist = 64 + (lighter ? 36 : 64) * penalty;
  const hip = 90 + (lighter ? -24 : 40) * penalty;
  const selected = cupFor(height, mode);
  return {
    height, weight, bmi, referenceWeight, weightDelta, relativeDeviation, penalty, cup: selected.cup,
    alternateCup: cupFor(height, mode === 'image1' ? 'image2' : 'image1').cup,
    underbust,
    bust: [underbust + selected.diff[0], selected.diff[1] === null ? null : underbust + selected.diff[1]],
    waist,
    hip,
    diff: selected.diff,
  };
}

export function formatBust([low, high]) {
  return high === null ? `${low.toFixed(1)}〜` : low === high ? low.toFixed(1) : `${low.toFixed(1)}〜${high.toFixed(1)}`;
}
