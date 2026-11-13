import queryString from 'query-string';
import axios from 'axios';
import store from '../store/store';
import { signalSuccessPatientRetrieval, signalFailurePatientRetrieval } from '../actions/patient-actions';

function retrieveFirstPatientId(fhirServer, headers) {
  return axios({
    method: 'get',
    url: `${fhirServer}/Patient?_count=1`,
    headers,
  }).then((result) => result.data?.entry?.[0]?.resource?.id).catch(() => undefined);
}

/**
 * Retrieve Patient resource from the FHIR server in context with the patient id retrieved from the Redux store or access token (if applicable)
 * and dispatch successful or failed connection to the endpoint on the FHIR server. Additionally, grab Conditions data too, since a list of conditions
 * need to be displayed under the Rx View (order-select workflow).
 * @returns {Promise} - Promise to resolve elsewhere
 */
function retrievePatient(testPatient) {
  return new Promise((resolve, reject) => {
    let patient = testPatient || '';
    let usingDefaultPatient = false;
    const { accessToken } = store.getState().fhirServerState;
    const fhirServer = store.getState().fhirServerState.currentFhirServer;
    const headers = {
      Accept: 'application/json+fhir',
    };

    // Grab patient ID from access token (if Sandbox launched securely)
    // Otherwise grab patient ID from query parameters, or localStorage cache, or default patient ID in store
    if (accessToken) {
      if (!patient) {
        ({ patient } = accessToken);
      }
      headers.Authorization = `Bearer ${accessToken.access_token}`;
    } else if (!patient) {
      const parsed = queryString.parse(window.location.search);
      patient = parsed.patientId || localStorage.getItem('PERSISTED_patientId');
      if (!patient) {
        patient = store.getState().patientState.defaultPatientId;
        usingDefaultPatient = true;
      }
    }
    axios({
      method: 'get',
      url: `${fhirServer}/Patient/${patient}`,
      headers,
    }).then((result) => {
      if (result.data && result.data.resourceType === 'Patient') {
        return axios({
          method: 'get',
          url: `${fhirServer}/Condition?patient=${patient}`,
          headers,
        }).then((conditionsResult) => {
          if (result.data) {
            store.dispatch(signalSuccessPatientRetrieval(result.data, conditionsResult.data));
            return resolve();
          }
          store.dispatch(signalSuccessPatientRetrieval(result.data));
          return resolve();
        }).catch(() => {
          store.dispatch(signalSuccessPatientRetrieval(result.data));
          return resolve();
        });
      }
      return reject();
    }).catch(async (err) => {
      // Public test servers can delete the default patient, so fall back to any patient on the server
      if (usingDefaultPatient) {
        const fallbackPatient = await retrieveFirstPatientId(fhirServer, headers);
        if (fallbackPatient) {
          console.warn(`Default patient ${patient} not found, using ${fallbackPatient} instead`);
          return retrievePatient(fallbackPatient).then(resolve, reject);
        }
      }
      console.error('Could not retrieve default patient from current FHIR server', err);
      store.dispatch(signalFailurePatientRetrieval());
      return reject(err);
    });
  });
}

export default retrievePatient;
