const targets = [
  { label: 'PASS', value: 50, tone: 'pass' },
  { label: 'CREDIT', value: 65, tone: 'credit' },
  { label: 'DISTINCTION', value: 75, tone: 'distinction' },
  { label: 'HIGH DISTINCTION', value: 85, tone: 'high-distinction' },
];

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `subject-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const exampleSubjects = [
  { id: createId(), name: 'COMP1001 - Programming Fundamentals', credits: 6, mark: 78, included: true },
  { id: createId(), name: 'MATH1001 - Calculus 1', credits: 6, mark: 65, included: true },
  { id: createId(), name: 'BUSS1000 - Introduction to Business', credits: 6, mark: 72, included: true },
  { id: createId(), name: 'ECON1001 - Principles of Economics', credits: 6, mark: 61, included: true },
  { id: createId(), name: 'COMM1000 - Communication Skills', credits: 6, mark: 74, included: true },
  { id: createId(), name: 'STAT1001 - Introduction to Statistics', credits: 6, mark: 80, included: true },
  { id: createId(), name: 'ACCT1001 - Accounting Fundamentals', credits: 6, mark: 58, included: true },
  { id: createId(), name: 'MGMT1001 - Management Principles', credits: 6, mark: 66, included: true },
];

let subjects = exampleSubjects.map((subject) => ({ ...subject }));

const $ = (selector) => document.querySelector(selector);
const rows = $('#subjectRows');

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getSubjectWam() {
  const included = subjects.filter((subject) => {
    const credits = toNumber(subject.credits);
    const mark = toNumber(subject.mark);
    return subject.included && credits > 0 && mark >= 0 && mark <= 100;
  });
  const credits = included.reduce((sum, subject) => sum + toNumber(subject.credits), 0);
  const weighted = included.reduce((sum, subject) => sum + toNumber(subject.credits) * toNumber(subject.mark), 0);

  return {
    hasSubjectWam: credits > 0,
    count: included.length,
    credits,
    wam: credits > 0 ? weighted / credits : NaN,
  };
}

function validate(total, completed, wam) {
  const errors = [];

  if (!Number.isFinite(total) || total <= 0) errors.push('Total degree credit points must be greater than 0.');
  if (!Number.isFinite(completed) || completed < 0) errors.push('Completed credit points cannot be negative.');
  if (Number.isFinite(total) && Number.isFinite(completed) && completed > total) {
    errors.push('Completed credit points must be less than or equal to total credit points.');
  }
  if (!Number.isFinite(wam) || wam < 0 || wam > 100) errors.push('Current WAM must be between 0 and 100.');

  subjects.forEach((subject, index) => {
    if (!subject.included) return;
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

function getTargetResult(target, total, completed, wam) {
  if (
    !Number.isFinite(total) ||
    !Number.isFinite(completed) ||
    !Number.isFinite(wam) ||
    total <= 0 ||
    completed < 0 ||
    wam < 0 ||
    wam > 100
  ) {
    return { ...target, status: 'invalid', message: 'Check inputs', detail: 'Enter valid credit points and WAM values.' };
  }

  if (completed > total) {
    return { ...target, status: 'invalid', message: 'Check inputs', detail: 'Completed credit points cannot exceed total.' };
  }

  const remaining = total - completed;

  if (wam >= target.value) {
    return {
      ...target,
      status: 'reached',
      message: 'Already reached',
      detail: `Your current WAM (${roundTo(wam, 2)}) is at or above ${target.value}.`,
    };
  }

  if (remaining <= 0) {
    return {
      ...target,
      status: 'no-remaining',
      message: 'No remaining credits',
      detail: 'There are no remaining credit points to improve this target.',
    };
  }

  const requiredWam = (target.value * total - wam * completed) / remaining;

  if (requiredWam > 100) {
    return {
      ...target,
      status: 'impossible',
      message: 'Not mathematically possible',
      detail: 'The required remaining average is above 100.',
    };
  }

  return {
    ...target,
    status: 'needed',
    message: `Needs ${roundTo(requiredWam, 1)} WAM`,
    detail: `Average needed across remaining ${roundTo(remaining, 1)} credit points.`,
  };
}

function iconFor(status) {
  if (status === 'reached') return '<path d="m5 12.5 4.2 4.2L19 7"></path>';
  if (status === 'impossible') {
    return '<path d="M6.5 5h11L21 10l-9 10-9-10 3.5-5Z"></path><path d="M8 10h8"></path><path d="m9 5 3 15 3-15"></path>';
  }
  return '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"></path>';
}

function renderSubjects() {
  rows.innerHTML = subjects
    .map(
      (subject, index) => `
        <div class="subject-row" role="row" data-id="${subject.id}">
          <span class="row-index">${index + 1}</span>
          <input type="text" data-field="name" aria-label="Subject ${index + 1} name" value="${escapeHtml(subject.name)}" placeholder="Subject name / code" />
          <input type="number" min="0" data-field="credits" aria-label="Subject ${index + 1} credit points" value="${subject.credits}" />
          <input type="number" min="0" max="100" data-field="mark" aria-label="Subject ${index + 1} mark" value="${subject.mark}" />
          <label class="switch">
            <input type="checkbox" data-field="included" ${subject.included ? 'checked' : ''} />
            <span></span>
          </label>
          <button class="icon-button" type="button" data-remove="${subject.id}" aria-label="Remove subject ${index + 1}" ${subjects.length === 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14"></path>
              <path d="M9 7V5h6v2"></path>
              <path d="M8 10v8"></path>
              <path d="M12 10v8"></path>
              <path d="M16 10v8"></path>
              <path d="M7 7l1 14h8l1-14"></path>
            </svg>
          </button>
        </div>
      `,
    )
    .join('');
}

function renderResults() {
  const total = toNumber($('#totalCredits').value);
  const completed = toNumber($('#completedCredits').value);
  const subjectWam = getSubjectWam();
  const manualWam = toNumber($('#currentWam').value);
  const effectiveWam = subjectWam.hasSubjectWam ? subjectWam.wam : manualWam;
  const remaining = Number.isFinite(total) && Number.isFinite(completed) ? Math.max(0, total - completed) : 0;
  const errors = validate(total, completed, effectiveWam);

  $('#remainingCredits').value = Number.isFinite(remaining) ? roundTo(remaining, 1) : '';
  $('#remainingLabel').textContent = Number.isFinite(remaining) ? roundTo(remaining, 1) : 0;
  $('#includedCount').textContent = subjectWam.count;
  $('#includedCredits').textContent = roundTo(subjectWam.credits, 1);
  $('#calculatedWam').textContent = subjectWam.hasSubjectWam ? roundTo(subjectWam.wam, 2) : 'N/A';
  $('#wamHint').textContent = subjectWam.hasSubjectWam ? 'Calculated from included subjects' : '0 to 100';
  $('#currentWam').disabled = subjectWam.hasSubjectWam;
  if (subjectWam.hasSubjectWam) $('#currentWam').value = roundTo(subjectWam.wam, 2);

  const validation = $('#validation');
  validation.className = `validation ${errors.length ? 'validation-error' : 'validation-good'}`;
  validation.innerHTML = errors.length
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 10.5v5"></path><path d="M12 7.5h.01"></path></svg><span>${escapeHtml(errors[0])}</span>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"></path></svg><span>All good. Inputs look valid.</span>`;

  $('#targetList').innerHTML = targets
    .map((target) => getTargetResult(target, total, completed, effectiveWam))
    .map(
      (target) => `
        <article class="target-card target-${target.tone} status-${target.status}">
          <div class="target-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">${iconFor(target.status)}</svg>
          </div>
          <div class="target-name">
            <h3>${target.label}</h3>
            <p>Target ${target.value}</p>
          </div>
          <div class="target-result">
            <strong>${target.message}</strong>
            <p>${target.detail}</p>
          </div>
        </article>
      `,
    )
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function syncSubjectFromInput(event) {
  const row = event.target.closest('[data-id]');
  if (!row) return;

  const id = row.dataset.id;
  const field = event.target.dataset.field;
  if (!field) return;

  subjects = subjects.map((subject) =>
    subject.id === id
      ? {
          ...subject,
          [field]: field === 'included' ? event.target.checked : event.target.value,
        }
      : subject,
  );
  renderResults();
}

rows.addEventListener('input', syncSubjectFromInput);
rows.addEventListener('change', syncSubjectFromInput);
rows.addEventListener('click', (event) => {
  const removeId = event.target.closest('[data-remove]')?.dataset.remove;
  if (!removeId) return;
  subjects = subjects.filter((subject) => subject.id !== removeId);
  renderSubjects();
  renderResults();
});

['#totalCredits', '#completedCredits', '#currentWam'].forEach((selector) => {
  $(selector).addEventListener('input', renderResults);
});

$('#addSubject').addEventListener('click', () => {
  subjects = [...subjects, { id: createId(), name: '', credits: 6, mark: '', included: true }];
  renderSubjects();
  renderResults();
});

$('#resetAll').addEventListener('click', () => {
  $('#totalCredits').value = 144;
  $('#completedCredits').value = 0;
  $('#currentWam').value = '';
  subjects = [{ id: createId(), name: '', credits: 6, mark: '', included: true }];
  renderSubjects();
  renderResults();
});

$('#loadExample').addEventListener('click', () => {
  $('#totalCredits').value = 144;
  $('#completedCredits').value = 72;
  $('#currentWam').value = 68.25;
  subjects = exampleSubjects.map((subject) => ({ ...subject, id: createId() }));
  renderSubjects();
  renderResults();
});

$('#formulaToggle').addEventListener('click', () => {
  const content = $('#formulaContent');
  const isHidden = content.hidden;
  content.hidden = !isHidden;
  $('#formulaToggle').setAttribute('aria-expanded', String(isHidden));
  $('#formulaToggleText').textContent = isHidden ? 'Hide' : 'Show';
});

renderSubjects();
renderResults();
