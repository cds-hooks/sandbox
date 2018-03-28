import queryString from 'query-string';
import axios from 'axios';
import { signalSuccessFhirServerRetrieval, signalFailureFhirServerRetrieval, setTestFhirServer } from '../actions/fhir-server-actions';
import store from '../store/store';

/**
 * Retrieve FHIR Server metadata from the /metadata endpoint and dispatch successful or failed connection.
 * @param testUrl - FHIR server in context
 * @returns {Promise} - Promise to resolve elsewhere
 */
function retrieveFhirMetadata(testUrl) {
  return new Promise((resolve, reject) => {
    let testFhirServer = testUrl;
    if (!testFhirServer) {
      const parsed = queryString.parse(window.location.search);
      testFhirServer = parsed.fhirServiceUrl || store.getState().fhirServerState.defaultFhirServer;
    }
    const headers = { Accept: 'application/json+fhir' };
    store.dispatch(setTestFhirServer(testFhirServer));
    axios({
      method: 'get',
      url: `${testFhirServer}/metadata`,
      headers,
    }).then((result) => {
      if (result.data && Object.keys(result.data).length) {
        store.dispatch(signalSuccessFhirServerRetrieval(testFhirServer, result.data));
        return resolve();
      }
      return reject();
    }).catch((err) => {
      console.error('Could not connect to metadata endpoint of the FHIR server', err);
      store.dispatch(signalFailureFhirServerRetrieval());
      return reject(err);
    });
  });
}

export default retrieveFhirMetadata;
