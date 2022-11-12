import { Theme } from "@mui/system";
import PropTypes from 'prop-types';
import { Box, Divider, Drawer, Stack, useMediaQuery } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Logo } from "../other/Logo";
import { NavItem } from './nav-item';
import GitHubIcon from '@mui/icons-material/GitHub';

const items = [
  {
    href: '/', icon: (<ArticleIcon fontSize="small"/>), title: 'Reports'
  },
  {
    href: '/tasks', icon: (<FormatListBulletedIcon fontSize="small"/>), title: 'Tasks'
  },
];

const bottomItems = [
  {
    href: 'https://github.com/EgorDm/BOLDER', icon: (<GitHubIcon fontSize="small"/>), title: 'Source Code',
    external: true,
  },
]

export const Sidebar = (props) => {
  const { open, onClose } = props;
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'), {
    defaultMatches: true, noSsr: false
  });

  const content = (<>
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', height: '100%'
      }}
    >
      <div>
        <Stack alignItems={"center"} sx={{ mt: 3, mb: 2, px: 2 }}>
          <Logo/>
        </Stack>
      </div>

      <Divider
        sx={{
          borderColor: '#2D3748', my: 3
        }}
      />
      <Box sx={{ flexGrow: 1 }}>
        {items.map((item) => (<NavItem
          key={item.title}
          icon={item.icon}
          href={item.href}
          title={item.title}
          external={false}
        />))}
      </Box>
      <Box sx={{ flex: 1 }}/>
      <Box sx={{ pb: 2 }}>
        {bottomItems.map((item) => (<NavItem
          key={item.title}
          icon={item.icon}
          href={item.href}
          title={item.title}
          external={item?.external ?? false}
        />))}
      </Box>
    </Box>
  </>);

  if (lgUp) {
    return (<Drawer
      anchor="left"
      open
      PaperProps={{
        sx: {
          backgroundColor: 'neutral.900', color: '#FFFFFF', width: 280
        }
      }}
      variant="permanent"
    >
      {content}
    </Drawer>);
  }

  return (<Drawer
    anchor="left"
    onClose={onClose}
    open={open}
    PaperProps={{
      sx: {
        backgroundColor: 'neutral.900', color: '#FFFFFF', width: 280
      }
    }}
    sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
    variant="temporary"
  >
    {content}
  </Drawer>);
};

Sidebar.propTypes = {
  onClose: PropTypes.func, open: PropTypes.bool
};
