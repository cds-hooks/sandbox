/* eslint import/no-extraneous-dependencies: 0 */

import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import reducers from '../reducers/index';

const logger = createLogger({
  collapsed: true,
});

// Create the Redux store, and apply logging middleware
const store = createStore(reducers, applyMiddleware(logger));
export default store;
