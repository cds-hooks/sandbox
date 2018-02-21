import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// Redux store to pass down to React app
import store from './store/store';

// Starting component for the application
import MainView from './components/MainView/main-view';

ReactDOM.render(
  <Provider store={store}>
    <MainView />
  </Provider>,
  document.getElementById('root')
);
