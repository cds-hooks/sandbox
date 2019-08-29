/* eslint import/no-extraneous-dependencies: 0 */

import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import immutableStateWatcher from 'redux-immutable-state-invariant';
import reducers from '../reducers/index';
import { persistFhirServer, persistPatient, persistHook } from '../middleware/persist-data';
import cds from '../middleware/cds-execution';

const logger = createLogger({
  collapsed: true,
});

const loggerMiddleware = process.env.NODE_ENV !== 'production'
  ? [immutableStateWatcher(), logger] : [];

// Create the Redux store, and apply logging middleware
const store = createStore(reducers, applyMiddleware(
  persistFhirServer,
  persistPatient,
  persistHook,
  cds.webMessageMiddleware,
  cds.middlewareFor(cds.evaluateCdsTriggers),
  cds.middlewareFor(cds.onSystemActions),
  ...loggerMiddleware,
));
export default store;
