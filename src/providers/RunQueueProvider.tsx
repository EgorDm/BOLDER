import _ from "lodash";
import React, { useCallback, useEffect, useMemo } from "react";
import useNotification from "../hooks/useNotification";
import { CellId } from "../types";
import { useCellFocusContext } from "./CellFocusProvider";
import { useNotebookContext } from "./NotebookProvider";

export const RunQueueContext = React.createContext<{
  queue: CellId[];
  runCells: (cellsIds: CellId[]) => void;
}>(null);

export const RunQueueProvider = (props: {
  children: React.ReactNode,
}) => {
  const { save, notebookRef } = useNotebookContext();
  const [ queue, setQueueInternal ] = React.useState<CellId[]>([]);
  const runQueueRef = React.useRef<CellId[]>([]);

  const setRunQueue = useCallback((cellsIds: CellId[]) => {
    setQueueInternal(cellsIds);
    runQueueRef.current = cellsIds;
  }, []);

  const runCells = useCallback((cellsIds: CellId[]) => {
    save();
    setRunQueue(_.uniq(
      runQueueRef.current.concat(
        cellsIds.filter(id => notebookRef.current?.results?.states[id]?.status !== 'RUNNING')
      )
    ));
  }, [ notebookRef ]);

  const { sendNotification } = useNotification();
  const { changed } = useNotebookContext();
  useEffect(() => {
    if (!changed && queue.length > 0) {
      console.debug('Dispatching run queue');
      for (const cellId of queue) {
        console.debug('TODO: run cell');
      }

      sendNotification({ variant: 'info', message: `Running ${queue.length} cell(s)` })
      setRunQueue([]);
    }
  }, [ changed, queue.length > 0 ]);

  const { focusRef } = useCellFocusContext();
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        runCells([ focusRef.current ]);
      }
    }

    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    }
  }, []);

  const contextValue = useMemo(() => ({
    queue, runCells,
  }), [ runCells ]);

  return (
    <RunQueueContext.Provider value={contextValue}>
      {props.children}
    </RunQueueContext.Provider>
  );
}

export const useRunQueueContext = () => {
  const context = React.useContext(RunQueueContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
