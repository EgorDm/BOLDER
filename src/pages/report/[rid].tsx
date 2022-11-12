import { Box } from '@mui/material';
import { useMatch } from "react-router";
// import { useRouter } from "next/router";
import { Layout } from '../../components/layout/layout';
import { Notebook } from "../../components/notebook/Notebook";
import { CellFocusProvider } from "../../providers/CellFocusProvider";
import { ClipboardProvider } from "../../providers/ClipboardProvider";
import { NotebookProvider } from "../../providers/NotebookProvider";
import { ReportProvider } from "../../providers/ReportProvider";
import { RunQueueProvider } from "../../providers/RunQueueProvider";
import { UndoHistoryProvider } from "../../providers/UndoHistoryProvider";


const NotebookPage = (props) => {
  const match = useMatch('/report/:rid');
  const rid = match.params.rid;
  // const router = useRouter()
  // const { rid } = router.query
  console.log(rid)

  return (
    <>
      <Box component="main">
        {rid && (
          <ReportProvider reportId={rid as string}>
            <NotebookProvider>
              <UndoHistoryProvider>
                <CellFocusProvider>
                  <ClipboardProvider>
                    <RunQueueProvider>
                      <Notebook/>
                    </RunQueueProvider>
                  </ClipboardProvider>
                </CellFocusProvider>
              </UndoHistoryProvider>
            </NotebookProvider>
          </ReportProvider>
        )}
      </Box>
    </>
  );
}

NotebookPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default NotebookPage;
