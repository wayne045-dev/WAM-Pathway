import assert from 'node:assert/strict';
import {
  calculateTargetResults,
  calculateWamFromSubjects,
  validateInputs,
} from './calculations.js';

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('calculates weighted WAM from included subjects', () => {
  const result = calculateWamFromSubjects([
    { credits: 6, mark: 80, included: true },
    { credits: 12, mark: 70, included: true },
    { credits: 6, mark: 50, included: false },
  ]);

  assert.equal(result.includedCredits, 18);
  assert.equal(result.includedCount, 2);
  assert.equal(result.wam, 73.33333333333333);
});

test('calculates required remaining WAM for a target', () => {
  const [pass, credit, distinction] = calculateTargetResults({
    totalCredits: 144,
    completedCredits: 72,
    currentWam: 70,
  });

  assert.equal(pass.status, 'reached');
  assert.equal(credit.status, 'reached');
  assert.equal(distinction.status, 'needed');
  assert.equal(distinction.requiredWam, 80);
});

test('marks targets above 100 remaining WAM as impossible', () => {
  const result = calculateTargetResults({
    totalCredits: 144,
    completedCredits: 120,
    currentWam: 70,
  }).find((target) => target.label === 'HIGH DISTINCTION');

  assert.equal(result.status, 'impossible');
});

test('shows no remaining credits when the degree is complete and target not reached', () => {
  const result = calculateTargetResults({
    totalCredits: 144,
    completedCredits: 144,
    currentWam: 70,
  }).find((target) => target.label === 'DISTINCTION');

  assert.equal(result.status, 'no-remaining');
});

test('validates common invalid input states', () => {
  const errors = validateInputs({
    totalCredits: 144,
    completedCredits: 150,
    currentWam: 101,
    subjects: [{ credits: 6, mark: -1, included: true }],
  });

  assert.equal(errors.length, 3);
});

console.log('All calculation tests passed.');
