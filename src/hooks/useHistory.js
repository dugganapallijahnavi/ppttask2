import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

const useHistory = (initialPresent) => {
  const [present, setPresent] = useState(initialPresent);
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  const commit = useCallback(
    (input) => {
      setPresent((prevPresent) => {
        const nextState =
          typeof input === 'function' ? input(prevPresent) : input;
        if (nextState === prevPresent) {
          return prevPresent;
        }
        pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), prevPresent];
        futureRef.current = [];
        return nextState;
      });
    },
    []
  );

  const replace = useCallback((nextState) => {
    setPresent(nextState);
  }, []);

  const undo = useCallback(() => {
    if (!pastRef.current.length) {
      return present;
    }
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [present, ...futureRef.current].slice(0, MAX_HISTORY);
    setPresent(previous);
    return previous;
  }, [present]);

  const redo = useCallback(() => {
    if (!futureRef.current.length) {
      return present;
    }
    const [next, ...rest] = futureRef.current;
    pastRef.current = [...pastRef.current, present].slice(-MAX_HISTORY);
    futureRef.current = rest;
    setPresent(next);
    return next;
  }, [present]);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return {
    present,
    set: commit,
    replace,
    undo,
    redo,
    canUndo,
    canRedo
  };
};

export default useHistory;
