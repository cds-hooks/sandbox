import { combineReducers } from 'redux';

// Reducers
import fhirServerReducers from './fhir-server-reducers';

const reducers = combineReducers({
  fhirServerState: fhirServerReducers,
});

export default reducers;
