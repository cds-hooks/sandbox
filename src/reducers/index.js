import { combineReducers } from 'redux';

// Reducers
import fhirServerReducers from './fhir-server-reducers';
import patientReducers from './patient-reducers';

const reducers = combineReducers({
  fhirServerState: fhirServerReducers,
  patientState: patientReducers,
});

export default reducers;
