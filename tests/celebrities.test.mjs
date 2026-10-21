import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CELEBRITIES, compareCelebrities, matchingCelebrities, celebrityGroups } from '../dist/celebrities.mjs';
import { calculate } from '../dist/model.mjs';

test('only qualifying people appear in results across the supported input range', () => {
  for (const profile of CELEBRITIES) {
    assert.ok(existsSync(new URL('../dist/' + profile.image, import.meta.url)), profile.name);
    assert.ok(profile.source.startsWith('https://'));
    assert.ok(profile.imageSource.startsWith('https://'));
  }
  for (const standard of ['image1','image2']) {
    for(let height=120; height<=230; height++) {
      for(let weight=30; weight<=220; weight+=5) {
        const result = calculate(height,weight,standard);
        const matches = matchingCelebrities(result);
        assert.ok(matches.every(p => p.category !== 'comedy' && p.meanGap<=3 && p.maxGap<=5));
        assert.equal(new Set(matches.map(p=>p.id)).size,matches.length);
        const groups = celebrityGroups(result);
        assert.equal(groups.featured.length+groups.more.length,15);
        assert.ok(groups.featured.length<=5);
        assert.equal(groups.catalog.length,CELEBRITIES.filter(p=>p.category!=='comedy').length);
      }
    }
  }
});

test('no-close-match inputs still show the nearest 15 references with truthful gaps', () => {
  for(const args of [[180,30],[120,220]]) {
    const result=calculate(...args);
    assert.deepEqual(matchingCelebrities(result),[]);
    const groups=celebrityGroups(result);
    assert.equal(groups.featured.length,5);
    assert.equal(groups.more.length,10);
    assert.ok([...groups.featured,...groups.more].every(p=>!p.isClose));
    assert.deepEqual([...groups.featured,...groups.more].map(p=>p.id),groups.catalog.slice(0,15).map(p=>p.id));
    assert.equal(groups.catalog.length,CELEBRITIES.filter(p=>p.category!=='comedy').length);
  }
  assert.deepEqual(matchingCelebrities(null),[]);
  assert.deepEqual(matchingCelebrities({bust:[NaN,NaN],waist:64,hip:90}),[]);
});

test('exact measurements match, while bust ranges keep interval semantics', () => {
  const exact=matchingCelebrities({bust:[90,90],waist:60,hip:90});
  assert.equal(exact[0].name,'井上和香');
  assert.equal(exact[0].meanGap,0);
  const profiles=[{name:'テスト',bust:93,waist:64,hip:90}];
  assert.equal(matchingCelebrities({bust:[90,95],waist:64,hip:90},profiles)[0].meanGap,0);
  assert.equal(matchingCelebrities({bust:[90,null],waist:64,hip:90},profiles)[0].meanGap,0);
  assert.deepEqual(matchingCelebrities({bust:[110,null],waist:64,hip:90},profiles),[]);
});

test('comedy remains separate and public cup metadata retains its source', () => {
  const groups=celebrityGroups(calculate(180,70));
  assert.equal(groups.comedy.length,2);
  assert.ok(groups.comedy.some(p=>p.id==='okubo'));
  assert.ok([...groups.featured,...groups.more,...groups.catalog].every(p=>p.category!=='comedy'));
  assert.ok(groups.catalog.every(p=>p.cup===null || (p.cupSource?.startsWith('https://') && p.cupNote)));
});

test('screenshot regression: distant measurements never receive a close label', () => {
  const result={bust:[92.6,92.6],waist:64.9,hip:90.6};
  const matches=matchingCelebrities(result);
  assert.ok(matches.length>=2);
  assert.ok(!matches.some(p=>p.id==='nanao'));
  const nanao=compareCelebrities(result).find(p=>p.id==='nanao');
  assert.equal(nanao.isClose,false);
  assert.ok(Math.abs(nanao.maxGap-12.6)<1e-8);
  const groups=celebrityGroups(result);
  assert.deepEqual(groups.featured.slice(0,matches.length).map(p=>p.id),matches.map(p=>p.id));
  assert.equal(groups.more.length,10);
  assert.ok(groups.catalog.some(p=>p.id==='nanao'));
});

test('expanded catalog includes all registered non-comedy people without the former 15-person cap', () => {
  const groups=celebrityGroups(calculate(181,72));
  assert.ok(groups.catalog.length>=30);
  assert.equal(groups.catalog.length,new Set(groups.catalog.map(p=>p.id)).size);
  for(const name of ['岡田紗佳','中村静香','天木じゅん','三上悠亜','相澤仁美']) assert.ok(groups.catalog.some(p=>p.name===name));
  assert.ok(groups.catalog.some(p=>p.name==='葉加瀬マイ' && p.isClose));
});
