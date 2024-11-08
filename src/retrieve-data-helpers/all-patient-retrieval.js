import axios from 'axios';
import store from '../store/store';

function retrieveAllPatientIds() {
  return new Promise((resolve, reject) => {
    const { accessToken } = store.getState().fhirServerState;
    const fhirServer = store.getState().fhirServerState.currentFhirServer;
    const headers = {
      Accept: 'application/json+fhir',
    };
    const patientIds = [];

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken.access_token}`;
    }

    axios({
      method: 'get',
      url: `${fhirServer}/Patient`,
      headers,
    }).then((result) => {
      if (result.data && result.data.resourceType === 'Bundle' 
        && Array.isArray(result.data.entry) && result.data.entry.length) {
          for (const patient of result.data.entry) {
            patientIds.push(patient.resource.id);
          }
          return resolve(patientIds);
      } else {
        return reject();
      }
    }).catch((err) => {
      console.error('Could not retrieve patients from current FHIR server', err);
      return reject(err);
    });
  });
}

export default retrieveAllPatientIds;