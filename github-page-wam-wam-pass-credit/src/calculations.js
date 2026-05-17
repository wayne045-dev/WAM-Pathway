export const DEFAULT_TARGETS = [
  { label: 'PASS', value: 50, tone: 'pass' },
  { label: 'CREDIT', value: 65, tone: 'credit' },
  { label: 'DISTINCTION', value: 75, tone: 'distinction' },
  { label: 'HIGH DISTINCTION', value: 85, tone: 'high-distinction' },
];

export function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return NaN;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

export function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function getIncludedSubjects(subjects) {
  return subjects.filter((subject) => {
    const credits = toNumber(subject.credits);
    const mark = toNumber(subject.mark);

    return subject.included && credits > 0 && mark >= 0 && mark <= 100;
  });
}

export function calculateWamFromSubjects(subjects) {
  const includedSubjects = getIncludedSubjects(subjects);
  const includedCredits = includedSubjects.reduce((sum, subject) => sum + toNumber(subject.credits), 0);

  if (includedCredits <= 0) {
    return {
      hasSubjectWam: false,
      includedCount: 0,
      includedCredits: 0,
      wam: NaN,
    };
  }

  const weightedMarks = includedSubjects.reduce(
    (sum, subject) => sum + toNumber(subject.mark) * toNumber(subject.credits),
    0,
  );

  return {
    hasSubjectWam: true,
    includedCount: includedSubjects.length,
    includedCredits,
    wam: weightedMarks / includedCredits,
  };
}

export function validateInputs({ totalCredits, completedCredits, currentWam, subjects }) {
  const errors = [];
  const total = toNumber(totalCredits);
  const completed = toNumber(completedCredits);
  const wam = toNumber(currentWam);

  if (!Number.isFinite(total) || total <= 0) {
    errors.push('Total degree credit points must be greater than 0.');
  }

  if (!Number.isFinite(completed) || completed < 0) {
    errors.push('Completed credit points cannot be negative.');
  }

  if (Number.isFinite(total) && Number.isFinite(completed) && completed > total) {
    errors.push('Completed credit points must be less than or equal to total credit points.');
  }

  if (!Number.isFinite(wam) || wam < 0 || wam > 100) {
    errors.push('Current WAM must be between 0 and 100.');
  }

  subjects.forEach((subject, index) => {
    if (!subject.included) {
      return;
    }

    const credits = toNumber(subject.credits);
    const mark = toNumber(subject.mark);

    if (subject.credits !== '' && (!Number.isFinite(credits) || credits <= 0)) {
      errors.push(`Subject ${index + 1} credit points must be greater than 0.`);
    }

    if (subject.mark !== '' && (!Number.isFinite(mark) || mark < 0 || mark > 100)) {
      errors.push(`Subject ${index + 1} mark must be between 0 and 100.`);
    }
  });

  return errors;
}

export function calculateTargetResults({ totalCredits, completedCredits, currentWam, targets = DEFAULT_TARGETS }) {
  const total = toNumber(totalCredits);
  const completed = toNumber(completedCredits);
  const wam = toNumber(currentWam);

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(completed) ||
    !Number.isFinite(wam) ||
    total <= 0 ||
    completed < 0 ||
    wam < 0 ||
    wam > 100
  ) {
    return targets.map((target) => ({
      ...target,
      status: 'invalid',
      message: 'Check inputs',
      detail: 'Enter valid credit points and WAM values.',
      requiredWam: NaN,
    }));
  }

  const remainingCredits = total - completed;

  return targets.map((target) => {
    if (completed > total) {
      return {
        ...target,
        status: 'invalid',
        message: 'Check inputs',
        detail: 'Completed credit points cannot exceed total credit points.',
        requiredWam: NaN,
      };
    }

    if (wam >= target.value) {
      return {
        ...target,
        status: 'reached',
        message: 'Already reached',
        detail: `Your current WAM (${roundTo(wam, 2)}) is at or above ${target.value}.`,
        requiredWam: 0,
      };
    }

    if (remainingCredits <= 0) {
      return {
        ...target,
        status: 'no-remaining',
        message: 'No remaining credits',
        detail: 'There are no remaining credit points to improve this target.',
        requiredWam: NaN,
      };
    }

    const requiredWam = (target.value * total - wam * completed) / remainingCredits;

    if (requiredWam > 100) {
      return {
        ...target,
        status: 'impossible',
        message: 'Not mathematically possible',
        detail: 'The required remaining average is above 100.',
        requiredWam,
      };
    }

    if (requiredWam < 0) {
      return {
        ...target,
        status: 'reached',
        message: 'Already reached',
        detail: `Your current WAM (${roundTo(wam, 2)}) is enough for this target.`,
        requiredWam,
      };
    }

    return {
      ...target,
      status: 'needed',
      message: `Needs ${roundTo(requiredWam, 1)} WAM`,
      detail: `Average needed across remaining ${roundTo(remainingCredits, 1)} credit points.`,
      requiredWam,
    };
  });
}
