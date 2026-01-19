import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';

// Create a default MUI theme for testing
const theme = createTheme();

// Custom render function that wraps with MUI ThemeProvider
export function renderWithTheme(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </StyledEngineProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Custom render function that wraps with both Redux Provider and MUI ThemeProvider
export function renderWithProviders(ui, { store, ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </StyledEngineProvider>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Override the default render with our custom one
export { renderWithTheme as render };
