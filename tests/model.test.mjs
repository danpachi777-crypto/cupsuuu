import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, cupFor, formatBust } from '../dist/model.mjs';

test('reference image 1: each boundary is inclusive', () => {
  const cases = [[159.9,'AA'],[160,'A'],[164.9,'A'],[165,'B'],[169.9,'B'],[170,'C'],[177.9,'C'],[178,'D'],[179.9,'D'],[180,'E'],[184.9,'E'],[185,'F'],[187.9,'F'],[188,'G'],[189.9,'G'],[190,'H']];
  for(const [height,cup] of cases) assert.equal(cupFor(height).cup,cup,`${height}cm`);
});
test('reference image 2: ranges from the source stay ranges', () => {
  const cases = [[149.9,'A'],[150,'A'],[154.9,'A'],[155,'A'],[159.9,'A'],[160,'B'],[164.9,'B'],[165,'B〜C'],[169.9,'B〜C'],[170,'D'],[174.9,'D'],[175,'E'],[179.9,'E'],[180,'F'],[184.9,'F'],[185,'G〜'],[189.9,'G〜'],[190,'G〜']];
  for(const [height,cup] of cases) assert.equal(cupFor(height,'image2').cup,cup,`${height}cm`);
});
test('181 cm uses the selected image; weight changes dimensions and preserves cup', () => {
  const example = calculate(181,71);
  assert.equal(example.cup,'E');
  assert.equal(example.alternateCup,'F');
  assert.equal(formatBust(example.bust),'92.0');
  assert.equal(example.waist.toFixed(1),'64.0');
  assert.equal(example.hip.toFixed(1),'90.0');
  const heavier = calculate(181,90);
  assert.equal(heavier.cup,'E');
  assert.ok(heavier.bust[0] > example.bust[0]);
  assert.ok(heavier.waist > example.waist);
  assert.ok(heavier.hip > example.hip);
  assert.equal(calculate(181,71,'image2').cup,'F');
});
test('cup difference and range formatting remain consistent', () => {
  const exact = calculate(160,50);
  assert.ok(Math.abs(exact.underbust - 72) < 0.00001);
  assert.equal(formatBust(exact.bust),'82.0');
  const range = calculate(165,60,'image2');
  assert.ok(Math.abs(range.bust[1]-range.bust[0]-2.5) < 0.00001);
  assert.match(formatBust(range.bust),/^\d+\.\d〜\d+\.\d$/);
  const open = calculate(190,80,'image2');
  assert.equal(open.bust[1],null);
  assert.match(formatBust(open.bust),/^\d+\.\d〜$/);
});
test('invalid measurements do not produce output', () => {
  for(const args of [[0,72],[-181,72],[NaN,72],[181,NaN],[181,0],[181,-72],[119.9,72],[230.1,72],[181,29.9],[181,220.1]]) assert.throws(()=>calculate(...args),RangeError);
});

test('180 cm / 30 kg does not get a tiny waist; 70 kg is the exact baseline', () => {
  const baseline = calculate(180,70);
  const lighter = calculate(180,30);
  assert.equal(baseline.referenceWeight,70);
  assert.equal(baseline.weightDelta,0);
  assert.equal(baseline.waist,64);
  assert.equal(baseline.hip,90);
  assert.equal(baseline.bust[0],92);
  assert.equal(lighter.cup,baseline.cup);
  assert.ok(lighter.waist > baseline.waist);
  assert.ok(lighter.hip < baseline.hip);
  assert.ok(lighter.bust[0] < baseline.bust[0]);
});

test('waist definition worsens continuously away from reference on both sides across all heights', () => {
  for (let height = 120; height <= 230; height++) {
    const reference = height - 110;
    for (const direction of [-1,1]) {
      let previous = calculate(height,reference < 30 ? 30 : reference);
      let start = reference < 30 ? 31 : reference + 1;
      if(direction < 0) start = reference - 1;
      for(let weight = start; weight >= 30 && weight <= 220; weight += direction) {
        const next = calculate(height,weight);
        assert.ok(next.waist / next.hip > previous.waist / previous.hip, `${height}cm ${weight}kg W/H`);
        assert.ok(next.waist / next.bust[0] > previous.waist / previous.bust[0], `${height}cm ${weight}kg W/B`);
        assert.ok([next.waist,next.hip,next.underbust,...next.bust].every(n => Number.isFinite(n) && n > 0));
        previous = next;
      }
    }
  }
});
