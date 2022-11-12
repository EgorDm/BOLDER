import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import tasks from './slices/taskSlice';
import reports from './slices/reportSlice';

const reducer = combineReducers({
  tasks,
  reports,
})

const store = configureStore({
  reducer,
})

export default store;
