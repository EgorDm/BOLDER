import _ from "lodash";
import React, { useCallback, useMemo, useRef } from "react";
import { taskRunCell } from "../services/tasks";
import { Notebook, setCellState } from "../types";
import { useNotebookContext } from "./NotebookProvider";


const TasksContext = React.createContext<{
  runCell: (cellId: string) => void,
}>(null);

export const TasksProvider = ({
  children,
}: {
  children: React.ReactNode,
}) => {
  const { notebookRef, setNotebook } = useNotebookContext();

  const taskList = useRef<Record<string, Promise<any>>>({});

  const runCell = useCallback(async (cellId: string) => {
    await taskRunCell(notebookRef, setNotebook, cellId);
  }, []);

  const contextValue = useMemo(() => ({
    runCell
  }), [ ]);

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
}

export const useTasksContext = () => {
  const context = React.useContext(TasksContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
