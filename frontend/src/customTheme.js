
export function getDesignTokens(mode) {
  return {
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#1976d2' },
            background: { default: '#fff' },
          }
        : {
            primary: { main: '#90caf9' },
            background: { default: '#121212' },
          }),
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  };
}

// Example input customizations for MUI
export const inputsCustomizations = {
  MuiTextField: {
    styleOverrides: {
      root: {
        marginBottom: '1rem',
      },
    },
  },
};