import createCache from "@emotion/cache";
import dayjs from "dayjs";
import { CacheProvider } from '@emotion/react';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "react-query";
import { Provider } from "react-redux";
import { TasksWidget } from "./containers/tasks/TasksWidget";
import NotebookPage from "./pages/report/[rid]";
import ReportsPage from "./pages/reports";
import TasksPage from "./pages/tasks";
import store from "./store";
import { theme } from './theme';
import { Route, Routes } from "react-router-dom";


const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime)

const clientSideEmotionCache = createCache({ key: 'css' });

export default function App(props) {
  const queryClient = new QueryClient();

  return (
    <div className="App">
      <CacheProvider value={clientSideEmotionCache}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <ThemeProvider theme={theme}>
                <SnackbarProvider maxSnack={3}>
                  <CssBaseline/>
                  <Routes>
                    <Route path="/" element={ReportsPage.getLayout(<ReportsPage/>)}/>
                    <Route path="/report/:rid" element={NotebookPage.getLayout(<NotebookPage/>)}/>
                    <Route path="/tasks" element={TasksPage.getLayout(<TasksPage/>)}/>
                  </Routes>
                  <TasksWidget/>
                </SnackbarProvider>
              </ThemeProvider>
            </LocalizationProvider>
          </QueryClientProvider>
        </Provider>
      </CacheProvider>
    </div>
  );
}
