import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux';
import storage from 'redux-persist-indexeddb-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import tasks from './slices/taskSlice';
import reports from './slices/reportSlice';

const persistConfig = {
  key: 'root',
  storage: storage('myDB'),
}

const reducer = combineReducers({
  tasks: persistReducer(persistConfig, tasks),
  reports: persistReducer(persistConfig, reports),
})

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export default store;
