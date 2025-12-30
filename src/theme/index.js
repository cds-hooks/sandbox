import { createTheme } from '@mui/material/styles';

/**
 * MUI Theme Configuration for CDS Hooks Sandbox
 *
 * This theme preserves the visual design from Terra UI while using MUI components.
 * Colors are extracted from the original Terra UI implementation.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#384e77', // Header background color from Terra ApplicationHeaderLayout
    },
    info: {
      main: '#0079be', // Info card indicator color
    },
    warning: {
      main: '#ffae42', // Warning card indicator color
    },
    error: {
      main: '#c00', // Critical card indicator color
    },
    text: {
      primary: '#333', // Default text color
      secondary: '#666',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none', // Terra buttons don't uppercase text
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Preserve Terra button text casing
        },
      },
    },
  },
  spacing: 8, // MUI default, can be adjusted if needed
});

export default theme;
