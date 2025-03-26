'use client';

import { createTheme } from '@mui/material/styles';

// Extend Theme to include custom properties
declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      bgAppMobile: string;
      bgPrimary: string;
      bgSecondary: string;
      bgTertiary: string;
      bgQuaternary: string;
      bgQuinary: string;
      bgSenary: string;

      borderPrimary: string;
      borderSecondary: string;

      colorPrimary: string;
      colorSecondary: string;
    };
  }

  interface ThemeOptions {
    custom?: {
      bgAppMobile?: string;
      bgPrimary?: string;
      bgSecondary?: string;
      bgTertiary?: string;
      bgQuaternary?: string;
      bgQuinary?: string;
      bgSenary?: string;
      borderPrimary?: string;
      borderSecondary?: string;
      colorPrimary?: string;
      colorSecondary?: string;
    };
  }
}

export const darkTheme = createTheme({
  palette: {
    primary: {
      main: '#0076c4'
    },
    secondary: {
      main: '#74546f'
    },
    mode: 'dark',
    background: {
      default: 'url(/bg-dialog.svg)', // Light gray background
      paper: '#2f2f2f' // White background for paper elements
    },
    text: {
      primary: '#fff',
      secondary: '#fff'
    },
    grey: {
      '300': '#f1f1f147'
    }
  },
  custom: {
    bgAppMobile: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)',
    bgPrimary: 'rgba(255, 255, 255, 0.08)',
    bgSecondary: '#121212',
    bgTertiary: 'rgba(255, 255, 255, 0.08)',
    bgQuaternary: 'rgba(255, 255, 255, 0.1)',
    bgQuinary: '#2c2c2c',
    bgSenary: '#304f65',
    borderPrimary: 'rgba(255, 255, 255, 0.3)',
    borderSecondary: 'rgba(255, 255, 255, 0.2)',
    colorPrimary: '#fff',
    colorSecondary: '#ecf3f1'
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
    h6: {
      color: '#fff'
    },
    body1: {
      color: '#fff'
    },
    body2: {
      color: '#fff'
    },
    subtitle1: {
      color: 'rgba(255, 255, 255, 0.6)'
    },
    subtitle2: {
      color: '#edeff099'
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

export const lightTheme = createTheme({
  palette: {
    primary: {
      main: '#0076c4' // Keep the same primary color
    },
    secondary: {
      main: '#74546f' // Keep the same secondary color
    },
    mode: 'light', // Set mode to 'light'
    background: {
      default: '#f4f7fa', // Light gray background
      paper: '#fff' // White background for paper elements
    },
    text: {
      primary: '#000', // Dark gray text
      secondary: '#555555' // Slightly lighter gray
    },
    grey: {
      '300': '#e0e0e0'
    }
  },
  custom: {
    bgAppMobile: 'linear-gradient(to right, #026693, #357591, #026693)',
    bgPrimary: '#e9e9ea',
    bgSecondary: '#8d8d8d',
    bgTertiary: '#fff',
    bgQuaternary: '#fff',
    bgQuinary: '#e9e9ea',
    bgSenary: '#fff',
    borderPrimary: 'rgba(0, 0, 0, 0.3)',
    borderSecondary: '#adafb3',
    colorPrimary: '#000',
    colorSecondary: '#000'
  },
  typography: {
    h1: {
      color: '#000'
    },
    h2: {
      color: '#000'
    },
    h3: {
      color: '#000'
    },
    h4: {
      color: '#000'
    },
    h5: {
      color: '#000'
    },
    h6: {
      color: '#000'
    },
    body1: {
      color: '#555555'
    },
    body2: {
      color: '#555555'
    },
    subtitle1: {
      color: 'rgba(0, 0, 0, 0.4)'
    },
    subtitle2: {
      color: '#555555'
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
          fontWeight: 600,
          borderRadius: '8px'
        }
      }
    }
  }
});
