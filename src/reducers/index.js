import { combineReducers } from 'redux';

// Reducers
import fhirServerReducers from './fhir-server-reducers';
import patientReducers from './patient-reducers';
import cdsServicesReducers from './cds-services-reducers';

const reducers = combineReducers({
  fhirServerState: fhirServerReducers,
  patientState: patientReducers,
  cdsServicesState: cdsServicesReducers,
});

export default reducers;
