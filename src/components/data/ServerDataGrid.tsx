import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box, Button,
  LinearProgress, Typography
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar
} from "@mui/x-data-grid";
import { GridFilterModel } from "@mui/x-data-grid/models/gridFilterModel";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import React, { useEffect, useMemo } from "react";
import { useMutation } from "react-query";
import useNotification from "../../hooks/useNotification";
import { Report } from "../../types";
import { extractErrorMessage } from "../../utils/errors";
import Link from '@mui/material/Link';
import { FormContainer } from "../layout/FormContainer";
import { ModalContainer } from "../layout/ModalContainer";


export const ExpandableCell = ({ value, maxLength = 200 }: GridRenderCellParams & { maxLength?: number }) => {
  const [ expanded, setExpanded ] = React.useState(false);

  return (
    <Box>
      {expanded ? value : value.slice(0, maxLength)}&nbsp;
      {value.length > maxLength && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          type="button"
          component="button"
          sx={{ fontSize: 'inherit' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'view less' : 'view more'}
        </Link>
      )}
    </Box>
  );
};


export const ServerDataGrid = (props: {
  data: any[],
  columns: GridColDef[],
  initialState: GridInitialStateCommunity,
  initialSorting: GridSortModel,
  initialFilter?: GridFilterModel,
  actions?: (params: GridRowParams, actions: React.ReactNode[]) => React.ReactNode[],

} & Partial<React.ComponentProps<typeof DataGrid>>) => {
  const {
    data, columns, initialState, initialSorting, initialFilter, actions, ...rest
  } = props;

  const [ deleteItem, setDeleteItem ] = React.useState<null | any>(null);

  const { sendNotification } = useNotification();

  const columnsProcessed = useMemo(() => {
    const actionsIntern = (params: GridRowParams) => [
      <GridActionsCellItem icon={<DeleteIcon/>} onClick={() => setDeleteItem(params.row)} label="Delete"/>,
    ]

    return [
      ...columns,
      {
        field: 'actions',
        type: 'actions',
        getActions: (params: GridRowParams) => [
          ...(
            actions
              ? actions(params, actionsIntern(params))
              : actionsIntern(params)
          )
        ]
      }
    ]
  }, [ columns ]);

  // useEffect(() => {
  //   const model = sortModel.length ? sortModel : initialSorting;
  //   const direction = model[0].sort === 'desc' ? '-' : '';
  //   const field = model[0].field;
  //   setOrdering(`${direction}${field}`);
  // }, [ sortModel, initialSorting ]);

  // useEffect(() => {
  //   setQuery(filterModel?.quickFilterValues?.join(' ') ?? '');
  // }, [ filterModel ]);

  return (
    <>
      <DataGrid
        {...rest}
        rows={data || []}
        pagination
        columns={columnsProcessed}
        rowsPerPageOptions={[ 20, 50, 100 ]}
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 100}
        components={{
          Toolbar: GridToolbar,
          LoadingOverlay: LinearProgress
        }}
        initialState={initialState}
        componentsProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
            py: 1,
            overflow: 'hidden',
          },
          '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': {
            py: '15px',
            overflow: 'hidden',
          },
          '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': {
            py: '22px',
            overflow: 'hidden',
          },
        }}
      />
      <ModalContainer
        title="Do you really want to delete this dataset?"
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
      >
        <FormContainer
          actions={<>
            <Button variant="contained" color={"info"} onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="contained" color={"error"} onClick={() => console.log('todo: delete item')}>Delete</Button>
          </>}
          loading={false}
        >
          <Typography>Are you sure you want to delete item <pre style={{display: 'inline'}}>{deleteItem?.name ?? deleteItem?.title}</pre></Typography>
        </FormContainer>
      </ModalContainer>
    </>
  )
}
