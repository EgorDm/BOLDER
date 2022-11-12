import {
  Card,
  CardActions,
  CardContent, CircularProgress,
  Collapse,
  Divider,
  IconButton,
  IconButtonProps,
  List, ListItem, ListItemButton,
  ListItemIcon, ListItemText,
  Typography
} from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { styled } from "@mui/material/styles";
import _ from "lodash";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectAllTasks } from "../../slices/taskSlice";
import { Task } from "../../types";
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import { formatDuration, formatUUIDShort } from "../../utils/formatting";
import CloudOffIcon from '@mui/icons-material/CloudOff';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const IN_PROGRESS_STATES = new Set([ 'PENDING', 'STARTED' ]);

const isTaskRunning = (task: Task) => IN_PROGRESS_STATES.has(task.state);


export const TasksWidget = (props: {}) => {
  const [ expanded, setExpanded ] = useState(false);
  const tasks = useSelector(selectAllTasks)
  const tasksInProgress = tasks.filter(isTaskRunning);

  const TaskList = useMemo(() => (
    <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
      {tasks.map(task => (
        <ListItem disablePadding key={task.task_id}>
          <ListItemButton>
            <ListItemIcon sx={{
              minWidth: '46px'
            }}>
              {
                isTaskRunning(task)
                  ? <CircularProgress size={24} color="primary"/>
                  : task.state === 'SUCCESS'
                    ? <CheckCircleOutlineIcon color="success"/>
                    : <ErrorOutlineIcon color="error"/>
              }
            </ListItemIcon>
            <ListItemText
              sx={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
              primary={`${formatUUIDShort(task.task_id)}: ${task.name}`}
              secondary={`Started ${formatDuration(task.created_at)}`}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  ), [ tasks ]);

  return (
    <Card sx={{
      width: 345,
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 100,
    }}>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {TaskList}
        <Divider/>
      </Collapse>
      <CardActions disableSpacing>
        <IconButton aria-label="progress">
          {
            tasksInProgress.length > 0 ? <CircularProgress size={24}/>
              : <FilterNoneIcon/>
          }
        </IconButton>
        <Typography paragraph sx={{ mb: 0, ml: 2 }}>
          {
            tasksInProgress.length > 0 ? `${tasksInProgress.length} tasks in progress`
              : 'No tasks in progress'
          }
        </Typography>
        <ExpandMore
          expand={expanded}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <ExpandMoreIcon/>
        </ExpandMore>
      </CardActions>
    </Card>
  );
}
