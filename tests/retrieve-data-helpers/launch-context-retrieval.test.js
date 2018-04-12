import configureStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';
import retrieveLaunchContext from '../../src/retrieve-data-helpers/launch-context-retrieval';

describe('Launch Context Retrieval', () => {
  console.error = jest.fn();
  let mockAxios;
  let axios;

  let link;
  const defaultFhirServer = 'http://default-fhir-server.com';
  const patientId = 'patient-id';
  const accessToken = { accessToken: '123' };

  beforeEach(() => {
    axios = require('axios').default;
    mockAxios = new MockAdapter(axios);
    link = {
      url: 'http://example-smart-app.com/launch',
    };
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('When POST to launch endpoint call is successful', () => {
    describe('And the response is not acceptable', () => {
      it('rejects the Promise with a new link object containing an error status from empty data', () => {
        mockAxios.onPost(`${defaultFhirServer}/_services/smart/Launch`).reply(200, {data: {}});
        return retrieveLaunchContext(link, accessToken, patientId, defaultFhirServer).catch((result) => {
          expect(result.url).toEqual(link.url);
          expect(result.error).toBeTruthy();
        });
      });

      it('rejects the Promise with a new link object containing an error status from empty response', () => {
        mockAxios.onPost(`${defaultFhirServer}/_services/smart/Launch`).reply(200, {});
        return retrieveLaunchContext(link, accessToken, patientId, defaultFhirServer).catch((result) => {
          expect(result.url).toEqual(link.url);
          expect(result.error).toBeTruthy();
        });
      });
    });

    describe('And the response is acceptable', () => {
      let newUrl;

      beforeEach(() => {
        newUrl = `${link.url}?launch=123&iss=${defaultFhirServer}`;
        mockAxios.onPost(`${defaultFhirServer}/_services/smart/Launch`).reply(200, { launch_id: '123' });
      });
      
      it('resolves the Promise with a new link object and appended parameters', () => {
        link.appContext = 'app-context';
        return retrieveLaunchContext(link, accessToken, patientId, defaultFhirServer).then((result) => {
          expect(result.url).toEqual(newUrl);
        });
      });

      it('resolves even if link already has query parameter', () => {
        link.url += '?stuff=stuff';
        newUrl = `${link.url}&launch=123&iss=${defaultFhirServer}`;
        return retrieveLaunchContext(link, accessToken, patientId, defaultFhirServer).then((result) => {
          expect(result.url).toEqual(newUrl);
        });
      });
    });
  });

  describe('When POST to launch endpoint call is unsuccessful', () => {
    it('rejects the Promise with a new link object containing an error status', () => {
      mockAxios.onPost(`${defaultFhirServer}/_services/smart/Launch`).reply(500);
      return retrieveLaunchContext(link, accessToken, patientId, defaultFhirServer).catch((result) => {
        expect(result.url).toEqual(link.url);
        expect(result.error).toBeTruthy();
      });
    });
  });
});
