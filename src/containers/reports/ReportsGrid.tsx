import EditIcon from '@mui/icons-material/Edit';
import {
  Box
} from "@mui/material";
import { GridActionsCellItem, GridColDef} from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import dayjs from "dayjs";
import React from "react";
import { ServerDataGrid } from "../../components/data/ServerDataGrid";
import { Report } from "../../types/reports";
import { formatDateTime, formatUUIDShort } from "../../utils/formatting";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { selectAllReports } from '../../slices';

const COLUMNS: GridColDef[] = [
  {
    field: 'id', headerName: 'ID', flex: 0.5,
    valueFormatter: (params) => formatUUIDShort(params.value)
  },
  {
    field: 'name', headerName: 'Name', flex: 0.5,
    valueGetter: (params) => params.row.notebook.metadata.name
  },
  {
    field: 'creator', headerName: 'Creator', flex: 0.5,
    valueGetter: (params) => params.value?.username
  },
  {
    field: 'created_at', headerName: 'Created At', flex: 0.5, type: 'dateTime', minWidth: 200,
    valueFormatter: (params) => formatDateTime(params.value)
  },
  {
    field: 'updated_at', headerName: 'Updated At', flex: 0.5, type: 'dateTime', minWidth: 200,
    valueFormatter: (params) => (dayjs(params.value) as any).fromNow()
  },
]

const INITIAL_STATE: GridInitialStateCommunity = {
  columns: {
    columnVisibilityModel: {}
  }
}

const INITIAL_SORTING: GridSortModel = [
  { field: 'created_at', sort: 'desc' }
]


export const ReportsGrid = (props: {}) => {
  const navigate = useNavigate();

  const reports = useSelector(selectAllReports);

  const onReportEdit = async (report: Report) => {
    await navigate(`/report/${report.id}`);
  }

  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <ServerDataGrid
        data={reports}
        columns={COLUMNS}
        initialState={INITIAL_STATE}
        initialSorting={INITIAL_SORTING}
        actions={(params, actions) => [
          ...actions,
          <GridActionsCellItem icon={<EditIcon/>} onClick={async () => await onReportEdit(params.row)} label="Edit"/>,
        ]}
      />
    </Box>
  )
}
