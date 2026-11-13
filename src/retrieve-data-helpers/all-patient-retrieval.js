import axios from 'axios';
import store from '../store/store';
import formatPatientName from '../utils/patient-name';

function retrieveAllPatientIds() {
  return new Promise((resolve, reject) => {
    const { accessToken } = store.getState().fhirServerState;
    const fhirServer = store.getState().fhirServerState.currentFhirServer;
    const headers = {
      Accept: 'application/json+fhir',
    };
    const patientInfoList = [];

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
        result.data.entry.forEach((patient) => {
          patientInfoList.push({
            id: patient.resource.id,
            name: formatPatientName(patient.resource.name),
            dob: patient.resource.birthDate,
          });
        });
        return resolve(patientInfoList);
      }
      return reject();
    }).catch((err) => {
      console.error('Could not retrieve patients from current FHIR server', err);
      return reject(err);
    });
  });
}

export default retrieveAllPatientIds;
