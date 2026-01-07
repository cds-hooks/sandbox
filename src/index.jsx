import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Redux store to pass down to React app
import store from './store/store';

// MUI theme
import theme from './theme';

// Starting component for the application
import MainView from './components/MainView/main-view';

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainView />
    </ThemeProvider>
  </Provider>,
  document.getElementById('root'),
);
