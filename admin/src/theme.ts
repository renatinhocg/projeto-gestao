import { createTheme } from '@mui/material/styles'

// Layout constants
export const SIDEBAR_WIDTH = 260
export const HEADER_HEIGHT = 64

// Design tokens extraídos do Figma (Horizon UI)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6C5CE7', // purple main (accent used in charts/buttons)
      dark: '#4B2CC8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A3AED0', // muted / secondary texts
      contrastText: '#2b3674',
    },
    background: {
      default: '#F7F9FF', // very light blue used across panels
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2b3674', // heading / main text (from exported JSX)
      secondary: '#6f7aa6',
    },
    success: {
      main: '#05CD99',
    },
    info: {
      main: '#00A3FF',
    },
  },
  typography: {
    fontFamily: ['"DM Sans"', 'Inter', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h1: { fontWeight: 700, color: '#2b3674' },
    h2: { fontWeight: 700, color: '#2b3674' },
    h3: { fontWeight: 700, color: '#2b3674' },
    body1: { color: '#2b3674' },
    body2: { color: '#6f7aa6' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 18px 40px rgba(112,144,176,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 16px',
        },
        containedPrimary: {
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      },
    },
  },
})

export default theme
