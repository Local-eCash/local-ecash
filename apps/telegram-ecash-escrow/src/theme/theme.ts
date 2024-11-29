'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0076c4'
    },
    secondary: {
      main: '#74546f'
    },
    mode: 'dark'
  },
  typography: {
    h1: {
      color: '#fff'
    },
    h2: {
      color: '#fff'
    },
    h3: {
      color: '#fff'
    },
    h4: {
      color: '#fff'
    },
    h5: {
      color: '#fff'
    },
    body1: {
      color: '#fff'
    },
    body2: {
      color: '#fff'
    }
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        action: {
          color: '#fff'
        },
        message: {
          color: '#fff'
        },
        icon: {
          color: '#fff'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#fff',
          fontWeight: 600,
          borderRadius: '8px'
        }
      }
    }
  }
});

export default theme;
