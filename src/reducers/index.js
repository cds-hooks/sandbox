import { combineReducers } from 'redux';

// Reducers
import fhirServerReducers from './fhir-server-reducers';
import patientReducers from './patient-reducers';
import cdsServicesReducers from './cds-services-reducers';
import hookReducers from './hook-reducers';
import serviceExchangeReducers from './service-exchange-reducers';

const reducers = combineReducers({
  fhirServerState: fhirServerReducers,
  patientState: patientReducers,
  cdsServicesState: cdsServicesReducers,
  hookState: hookReducers,
  serviceExchangeState: serviceExchangeReducers,
});

export default reducers;
