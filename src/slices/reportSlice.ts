import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Report } from "../types/reports";


const useReportSlice = createSlice({
  name: 'report',
  initialState: {
    reports: {} as Record<string, Report>,
  },
  reducers: {
    updateReport: (state, action: PayloadAction<Report>) => {
      state.reports[action.payload.id] = action.payload;
    },
    removeReport: (state, action: PayloadAction<string>) => {
      delete state.reports[action.payload];
    }
  },
});

export type ReportsState = ReturnType<typeof useReportSlice.getInitialState>;

export const reportsSelector = (state): ReportsState => state.reports;

export const selectAllReports = (state) => Object.values(reportsSelector(state).reports);

export const selectReport = (state, id: string) => reportsSelector(state).reports[id];

export const {
  updateReport,
  removeReport,
} = useReportSlice.actions;
export default useReportSlice.reducer;
