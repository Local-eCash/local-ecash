'use client';

import { createTheme } from '@mui/material/styles';

// Extend Theme to include custom properties
declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      bgMain: string;
      bgItem: string;
      bgItem2: string;
      bgItem3: string;
      bgItem4: string;
      bgItem5: string;
      bgItem6: string;
      borderColor: string;
      borderColor1: string;
      colorItem: string;
      colorItem1: string;
    };
  }

  interface ThemeOptions {
    custom?: {
      bgMain?: string;
      bgItem?: string;
      bgItem2?: string;
      bgItem3?: string;
      bgItem4?: string;
      bgItem5?: string;
      bgItem6?: string;
      borderColor?: string;
      borderColor1?: string;
      colorItem?: string;
      colorItem1?: string;
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
    bgMain: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)',
    bgItem: 'rgba(255, 255, 255, 0.08)',
    bgItem2: '#121212',
    bgItem3: 'rgba(255, 255, 255, 0.08)',
    bgItem4: 'rgba(255, 255, 255, 0.1)',
    bgItem5: '#2c2c2c',
    bgItem6: '#304f65',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderColor1: 'rgba(255, 255, 255, 0.2)',
    colorItem: '#fff',
    colorItem1: '#ecf3f1'
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
    bgMain: 'linear-gradient(to right, #026693, #357591, #026693)',
    bgItem: '#e9e9ea',
    bgItem2: '#8d8d8d',
    bgItem3: '#fff',
    bgItem4: '#fff',
    bgItem5: '#e9e9ea',
    bgItem6: '#fff',
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderColor1: '#adafb3',
    colorItem: '#000',
    colorItem1: '#000'
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
