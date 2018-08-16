import axios from 'axios';
import store from '../store/store';

export default function retrievePatientsList() {
    return new Promise((resolve, reject) => {
      const fhirServer = store.getState().fhirServerState.currentFhirServer;
      const headers = {
        Accept: 'application/json+fhir',
      };
  
      axios({
        method: 'get',
        url: `${fhirServer}/Patient`,
        headers,
      }).then((result) => {
        if (result.data && result.data.total > 0) {
          return resolve(result.data.entry);
        }
        return reject();
      }).catch((err) => {
        console.error('Could not retrieve patient list from current FHIR server', err);
        return reject(err);
      });
    });
  }