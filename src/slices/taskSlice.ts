import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Task } from "../types";


const useTaskSlice = createSlice({
  name: 'task',
  initialState: {
    tasks: {} as Record<string, Task>,
  },
  reducers: {
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks[action.payload.task_id] = action.payload;
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      state.tasks[action.payload.task_id] = action.payload;
    },
    removeTask: (state, action: PayloadAction<string>) => {
      delete state.tasks[action.payload];
    },
  },
});

export type TasksState = ReturnType<typeof useTaskSlice.getInitialState>;

export const tasksSelector = (state): TasksState => state.tasks;

export const selectAllTasks = (state): Task[] => {
  console.log('state', state);
  return Object.values(tasksSelector(state).tasks);
};

export const {
  addTask,
  updateTask,
  removeTask,
} = useTaskSlice.actions;
export default useTaskSlice.reducer;
