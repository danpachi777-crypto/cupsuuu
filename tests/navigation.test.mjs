import test from 'node:test';
import assert from 'node:assert/strict';
import { readInputs, inputHash } from '../dist/navigation.mjs';

test('input and result page links preserve exact inputs including decimals and the selected standard', () => {
  for (const standard of ['image1','image2']) {
    for(const [height,weight] of [[180,30],[180,70],[181.1,72.5],[120,220],[230,30]]) {
      const inputs = {height,weight,standard};
      assert.deepEqual(readInputs(inputHash(inputs)),inputs);
    }
  }
});

test('direct, missing and malformed result inputs cannot produce bogus results', () => {
  for(const hash of ['', '#', '#height=180', '#height=180&weight=70', '#height=&weight=70&standard=image1', '#height=NaN&weight=70&standard=image1', '#height=180&weight=Infinity&standard=image1', '#height=180&weight=29&standard=image1', '#height=180&weight=70&standard=unknown', '#height=180.01&weight=70&standard=image1', '#height=%3Cscript%3E&weight=70&standard=image1']) assert.equal(readInputs(hash),null,hash);
});
