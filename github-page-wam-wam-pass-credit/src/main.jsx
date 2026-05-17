import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DEFAULT_TARGETS,
  calculateTargetResults,
  calculateWamFromSubjects,
  roundTo,
  toNumber,
  validateInputs,
} from './calculations.js';
import './styles.css';

const EXAMPLE_SUBJECTS = [
  { id: 'subject-1', name: 'COMP1001 - Programming Fundamentals', credits: 6, mark: 78, included: true },
  { id: 'subject-2', name: 'MATH1001 - Calculus 1', credits: 6, mark: 65, included: true },
  { id: 'subject-3', name: 'BUSS1000 - Introduction to Business', credits: 6, mark: 72, included: true },
  { id: 'subject-4', name: 'ECON1001 - Principles of Economics', credits: 6, mark: 61, included: true },
  { id: 'subject-5', name: 'COMM1000 - Communication Skills', credits: 6, mark: 74, included: true },
  { id: 'subject-6', name: 'STAT1001 - Introduction to Statistics', credits: 6, mark: 80, included: true },
  { id: 'subject-7', name: 'ACCT1001 - Accounting Fundamentals', credits: 6, mark: 58, included: true },
  { id: 'subject-8', name: 'MGMT1001 - Management Principles', credits: 6, mark: 66, included: true },
];

const EMPTY_SUBJECT = {
  name: '',
  credits: 6,
  mark: '',
  included: true,
};

function makeSubject(seed = EMPTY_SUBJECT) {
  return {
    id: crypto.randomUUID(),
    ...seed,
  };
}

function App() {
  const [totalCredits, setTotalCredits] = useState(144);
  const [completedCredits, setCompletedCredits] = useState(72);
  const [manualWam, setManualWam] = useState(68.25);
  const [subjects, setSubjects] = useState(EXAMPLE_SUBJECTS);
  const [formulaOpen, setFormulaOpen] = useState(true);

  const subjectSummary = useMemo(() => calculateWamFromSubjects(subjects), [subjects]);
  const effectiveWam = subjectSummary.hasSubjectWam ? subjectSummary.wam : toNumber(manualWam);
  const remainingCredits = Math.max(0, toNumber(totalCredits) - toNumber(completedCredits));
  const targetResults = useMemo(
    () =>
      calculateTargetResults({
        totalCredits,
        completedCredits,
        currentWam: effectiveWam,
        targets: DEFAULT_TARGETS,
      }),
    [completedCredits, effectiveWam, totalCredits],
  );
  const validationErrors = useMemo(
    () =>
      validateInputs({
        totalCredits,
        completedCredits,
        currentWam: effectiveWam,
        subjects,
      }),
    [completedCredits, effectiveWam, subjects, totalCredits],
  );

  function updateSubject(id, key, value) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id
          ? {
              ...subject,
              [key]: value,
            }
          : subject,
      ),
    );
  }

  function addSubject() {
    setSubjects((current) => [...current, makeSubject()]);
  }

  function removeSubject(id) {
    setSubjects((current) => current.filter((subject) => subject.id !== id));
  }

  function loadExample() {
    setTotalCredits(144);
    setCompletedCredits(72);
    setManualWam(68.25);
    setSubjects(EXAMPLE_SUBJECTS);
  }

  function resetAll() {
    setTotalCredits(144);
    setCompletedCredits(0);
    setManualWam('');
    setSubjects([makeSubject()]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <GraduationIcon />
          <div>
            <h1>WAM Pathway</h1>
            <span>Australian University WAM Calculator</span>
          </div>
        </div>
        <div className="topbar-actions">
          <a href="https://github.com/" aria-label="Open GitHub">
            <GithubIcon />
            <span>View on GitHub</span>
          </a>
          <span className="static-pill">GitHub Pages · Static App</span>
        </div>
      </header>

      <main className="page">
        <section className="notice" aria-label="Calculator summary">
          <InfoIcon />
          <p>
            WAM Pathway calculates your current Weighted Average Mark (WAM) and the average needed in
            remaining credit points to reach each target.
          </p>
        </section>

        <div className="workspace">
          <section className="panel input-panel" aria-labelledby="degree-overview-title">
            <div className="section-heading">
              <div>
                <h2 id="degree-overview-title">Your degree overview</h2>
                <p>Enter your degree size, progress, and marks.</p>
              </div>
            </div>

            <div className="overview-grid">
              <NumberField
                label="Total degree credit points"
                hint="e.g. 144 for a 3-year degree"
                value={totalCredits}
                min="1"
                onChange={setTotalCredits}
              />
              <NumberField
                label="Completed credit points"
                hint="Must be less than total"
                value={completedCredits}
                min="0"
                onChange={setCompletedCredits}
              />
              <NumberField
                label="Current WAM"
                hint={subjectSummary.hasSubjectWam ? 'Calculated from included subjects' : '0 to 100'}
                value={subjectSummary.hasSubjectWam ? roundTo(subjectSummary.wam, 2) : manualWam}
                min="0"
                max="100"
                disabled={subjectSummary.hasSubjectWam}
                onChange={setManualWam}
              />
              <NumberField
                label="Remaining credit points"
                hint="Calculated"
                value={Number.isFinite(remainingCredits) ? roundTo(remainingCredits, 1) : ''}
                disabled
                onChange={() => {}}
              />
            </div>

            <div className="divider" />

            <div className="subjects-heading">
              <div>
                <h3>Subjects completed <span>(optional but recommended)</span></h3>
                <p>Add units you have completed. Included units are used to calculate your WAM.</p>
              </div>
              <button className="button button-outline" type="button" onClick={addSubject}>
                <PlusIcon />
                Add subject
              </button>
            </div>

            <div className="subject-table" role="table" aria-label="Completed subjects">
              <div className="subject-row subject-row-head" role="row">
                <span>#</span>
                <span>Subject name / code</span>
                <span>Credit points</span>
                <span>Mark (%)</span>
                <span>Include</span>
                <span>Actions</span>
              </div>
              {subjects.map((subject, index) => (
                <div className="subject-row" role="row" key={subject.id}>
                  <span className="row-index">{index + 1}</span>
                  <input
                    type="text"
                    aria-label={`Subject ${index + 1} name`}
                    value={subject.name}
                    placeholder="Subject name / code"
                    onChange={(event) => updateSubject(subject.id, 'name', event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    aria-label={`Subject ${index + 1} credit points`}
                    value={subject.credits}
                    onChange={(event) => updateSubject(subject.id, 'credits', event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    aria-label={`Subject ${index + 1} mark`}
                    value={subject.mark}
                    onChange={(event) => updateSubject(subject.id, 'mark', event.target.value)}
                  />
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={subject.included}
                      onChange={(event) => updateSubject(subject.id, 'included', event.target.checked)}
                    />
                    <span />
                  </label>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove subject ${index + 1}`}
                    onClick={() => removeSubject(subject.id)}
                    disabled={subjects.length === 1}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            <div className="subject-summary" aria-label="Included subjects summary">
              <span>Included: <strong>{subjectSummary.includedCount}</strong> subjects</span>
              <span>Included credit points: <strong>{roundTo(subjectSummary.includedCredits, 1)}</strong></span>
              <span>
                Calculated WAM:{' '}
                <strong>{subjectSummary.hasSubjectWam ? roundTo(subjectSummary.wam, 2) : 'N/A'}</strong>
              </span>
            </div>

            <div className="panel-actions">
              <div className="button-group">
                <button className="button button-primary" type="button" onClick={resetAll}>
                  <ResetIcon />
                  Reset all
                </button>
                <button className="button button-outline" type="button" onClick={loadExample}>
                  Load example
                </button>
              </div>
              <ValidationSummary errors={validationErrors} />
            </div>
          </section>

          <aside className="panel results-panel" aria-labelledby="results-title">
            <div className="section-heading">
              <div>
                <h2 id="results-title">Your WAM pathway</h2>
                <p>
                  Based on{' '}
                  <strong>{Number.isFinite(remainingCredits) ? roundTo(remainingCredits, 1) : 0}</strong>{' '}
                  credit points remaining
                </p>
              </div>
            </div>

            <div className="target-list">
              {targetResults.map((target) => (
                <TargetCard key={target.label} target={target} currentWam={effectiveWam} />
              ))}
            </div>

            <section className="formula-panel" aria-labelledby="formula-title">
              <button
                className="formula-toggle"
                type="button"
                onClick={() => setFormulaOpen((open) => !open)}
                aria-expanded={formulaOpen}
              >
                <span id="formula-title">How WAM is calculated</span>
                <span>{formulaOpen ? 'Hide' : 'Show'}</span>
              </button>
              {formulaOpen && (
                <div className="formula-content">
                  <p>
                    WAM is a weighted average of your marks, where each unit&apos;s mark is weighted by its
                    credit points.
                  </p>
                  <div className="formula">
                    WAM = Σ(Mark × Credit Points) / Σ(Credit Points)
                  </div>
                  <p>
                    Required remaining WAM = (Target × Total CP - Current WAM × Completed CP) /
                    Remaining CP.
                  </p>
                  <p className="policy-note">
                    WAM policies vary between universities. Always check your university handbook for official
                    information.
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>

        <footer className="footer-note">
          <InfoIcon />
          <span>
            Note: PASS, CREDIT, DISTINCTION, and HIGH DISTINCTION thresholds are common defaults, not official
            rules for every university.
          </span>
        </footer>
      </main>
    </div>
  );
}

function NumberField({ label, hint, value, onChange, disabled = false, min, max }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <small>{hint}</small>
    </label>
  );
}

function TargetCard({ target }) {
  return (
    <article className={`target-card target-${target.tone} status-${target.status}`}>
      <div className="target-icon" aria-hidden="true">
        {target.status === 'reached' ? <CheckIcon /> : target.status === 'impossible' ? <DiamondIcon /> : <StarIcon />}
      </div>
      <div className="target-name">
        <h3>{target.label}</h3>
        <p>Target {target.value}</p>
      </div>
      <div className="target-result">
        <strong>{target.message}</strong>
        <p>{target.detail}</p>
      </div>
    </article>
  );
}

function ValidationSummary({ errors }) {
  if (errors.length === 0) {
    return (
      <p className="validation validation-good">
        <CheckIcon />
        All good. Inputs look valid.
      </p>
    );
  }

  return (
    <div className="validation validation-error" role="alert">
      <InfoIcon />
      <span>{errors[0]}</span>
    </div>
  );
}

function GraduationIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M4 17.5 24 8l20 9.5L24 27 4 17.5Z" />
      <path d="M12 22.5v9c5.8 4.2 18.2 4.2 24 0v-9" />
      <path d="M42 19.5v12" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.4a9.7 9.7 0 0 0-3.1 18.9c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.8 0-1.1.4-2 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.5 1 2.6 0 3.7-2.3 4.5-4.6 4.8.4.3.7 1 .7 2v2.5c0 .3.2.6.7.5A9.7 9.7 0 0 0 12 2.4Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M9 7V5h6v2" />
      <path d="M8 10v8" />
      <path d="M12 10v8" />
      <path d="M16 10v8" />
      <path d="M7 7l1 14h8l1-14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 5h11L21 10l-9 10-9-10 3.5-5Z" />
      <path d="M8 10h8" />
      <path d="m9 5 3 15 3-15" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 4v6h6" />
    </svg>
  );
}

createRoot(document.getElementById('root')).render(<App />);
