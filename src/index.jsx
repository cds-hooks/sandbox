import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Base from 'terra-base';

// Redux store to pass down to React app
import store from './store/store';

// Starting component for the application
import MainView from './components/MainView/main-view';

ReactDOM.render(
  <Provider store={store}>
    <Base locale='en-US'>
      <MainView />
    </Base>
  </Provider>,
  document.getElementById('root')
);
