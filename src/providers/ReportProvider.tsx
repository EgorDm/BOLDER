import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useNotification from "../hooks/useNotification";
import { selectReport, updateReport } from "../slices/reportSlice";
import { Report } from "../types";
import { namespacesToPrefixes, WDT_NAMESPACES } from "../utils/sparql";


const ReportContext = React.createContext<{
  report: Report | null,
  reportRef: React.MutableRefObject<Report | null>,
  save: (report: Report) => void,
}>(null);


export const ReportProvider = (props: {
  reportId: string,
  children: React.ReactNode,
}) => {
  const { sendNotification } = useNotification();

  const { reportId, children, } = props;

  const dispatch = useDispatch();

  const remoteReport = useSelector(state => selectReport(state, reportId));
  const [ report, setReportInternal ] = React.useState<Report | null>(remoteReport);
  const reportRef = React.useRef<Report | null>(remoteReport);

  const setReport = useCallback((report: Report) => {
    setReportInternal(report);
    reportRef.current = report;
  }, []);

  const save = useCallback((report?: Report) => {
    sendNotification({ variant: 'info', message: `Saving report` });
    console.debug('Saved report', report);
    setReport(report);
    dispatch(updateReport(report));
    // TODO: Save report to ldb?
  }, []);

  const contextValue = useMemo(() => ({
    report, reportRef, setReport, save,
  }), [ report ]);

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
}

export const useReportContext = () => {
  const context = React.useContext(ReportContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
