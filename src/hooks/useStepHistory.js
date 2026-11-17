import { useEffect, useRef } from 'react';

// Keeps the browser history in step with the app's screens so Back/Forward
// move between wizard steps and "My Timetables", and a reload keeps the screen.
//   #step-1 ... #step-4   wizard steps
//   #saved                saved timetables list

export const hashFor = ({ view, step }) => (view === 'saved' ? '#saved' : `#step-${step}`);

export const parseHash = (hash) => {
  if (hash === '#saved') return { view: 'saved' };
  const match = /^#step-([1-4])$/.exec(hash);
  return match ? { view: 'generator', step: Number(match[1]) } : null;
};

export const useStepHistory = ({ view, setView, step, setStep, canShowStep }) => {
  const initialised = useRef(false);

  // App state -> history: add an entry whenever the screen changes. The first
  // run only replaces the current entry so a reload doesn't add one.
  useEffect(() => {
    const hash = hashFor({ view, step });
    if (window.location.hash === hash) {
      initialised.current = true;
      return;
    }
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    if (initialised.current) {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
      initialised.current = true;
    }
  }, [view, step]);

  // History -> app state: Back/Forward (or editing the hash by hand).
  const canShowStepRef = useRef(canShowStep);
  canShowStepRef.current = canShowStep;

  useEffect(() => {
    const onPopState = () => {
      const target = parseHash(window.location.hash);
      if (!target) return;
      setView(target.view);
      if (target.view === 'generator') {
        // An entry can point at a step that no longer makes sense (e.g. the
        // result after "Start Over"); fall back to the nearest earlier step.
        let next = target.step;
        while (next > 1 && !canShowStepRef.current(next)) next -= 1;
        if (next !== target.step) {
          window.history.replaceState(null, '', hashFor({ view: 'generator', step: next }));
        }
        setStep(next);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setView, setStep]);
};
