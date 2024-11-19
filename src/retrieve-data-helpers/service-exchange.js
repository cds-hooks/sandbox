import axios from 'axios';
import queryString from 'query-string';
import retrieveLaunchContext from './launch-context-retrieval';
import {
  storeExchange,
  storeLaunchContext,
} from '../actions/service-exchange-actions';
import { productionClientId, allScopes } from '../config/fhir-config';
import generateJWT from './jwt-generator';

const uuidv4 = require('uuid/v4');

const remapSmartLinks = ({
  dispatch,
  cardResponse,
  fhirAccessToken,
  patientId,
  fhirServerUrl,
}) => {
  ((cardResponse && cardResponse.cards) || [])
    .flatMap((card) => card.links || [])
    .filter(({ type }) => type === 'smart')
    .forEach((link) => retrieveLaunchContext(
      link,
      fhirAccessToken,
      patientId,
      fhirServerUrl,
    ).catch((e) => e).then((newLink) => dispatch(storeLaunchContext(newLink))));
};

/**
 * Encode each query parameter value for the query string of a prefetch condition
 * @param template - String URL to URI encode query parameters for
 * @returns {*} - String URL with its query parameters URI encoded if necessary
 */
function encodeUriParameters(template) {
  if (template && template.split('?').length > 1) {
    const splitUrl = template.split('?');
    const queryParams = queryString.parse(splitUrl[1]);
    Object.keys(queryParams).forEach((param) => {
      const val = queryParams[param];
      queryParams[param] = encodeURIComponent(val);
    });
    splitUrl[1] = queryString.stringify(queryParams, { encode: false });
    return splitUrl.join('?');
  }
  return template;
}

/**
 * Replace prefetch templates in the query parameters with the Patient ID and/or User ID in context
 * @param prefetch - Prefetch key/value pair from a CDS Service definition
 * @returns {*} - New prefetch key/value pair Object with prefetch template filled out
 */
function completePrefetchTemplate(state, prefetch) {
  const patient = state.patientState.currentPatient.id;
  const user = state.patientState.currentUser || state.patientState.defaultUser;
  const prefetchRequests = { ...prefetch };
  Object.keys(prefetchRequests).forEach((prefetchKey) => {
    let prefetchTemplate = prefetchRequests[prefetchKey];
    prefetchTemplate = prefetchTemplate.replace(
      /{{\s*context\.patientId\s*}}/g,
      patient,
    );
    prefetchTemplate = prefetchTemplate.replace(/{{\s*user\s*}}/g, user);
    prefetchTemplate = prefetchTemplate.replace(/{{\s*context\.userId\s*}}/g, user);
    prefetchRequests[prefetchKey] = encodeUriParameters(prefetchTemplate);
  });
  return prefetchRequests;
}

/**
 * Fetch data from FHIR server for each prefetch request and return a Promise with the data resolved eventually
 * @param baseUrl - FHIR server base URL to prefetch data from
 * @param prefetch - Prefetch templates from a CDS Service definition filled out
 * @returns {Promise} - Promise object to eventually fetch data
 */
async function prefetchDataPromises(state, baseUrl, prefetch) {
  const resultingPrefetch = {};
  const prefetchRequests = {
    ...completePrefetchTemplate(state, prefetch),
  };

  const prefetchKeys = Object.keys(prefetchRequests);
  const headers = { Accept: 'application/json+fhir' };
  const { accessToken } = state.fhirServerState;
  if (accessToken && accessToken.access_token) {
    headers.Authorization = `Bearer ${accessToken.access_token}`;
  }

  // Create an array of promises for each request
  const promises = prefetchKeys.map(async (key) => {
    const prefetchValue = prefetchRequests[key];
    const resource = prefetchValue.split('?')[0];
    const params = new URLSearchParams(prefetchValue.split('?')[1]);
    let usePost = true;

    try {
      if (usePost) {
        const result = await axios({
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          data: params.toString(),
          url: `${baseUrl}/${resource}/_search`,
        });
        if (result.data && Object.keys(result.data).length) {
          resultingPrefetch[key] = result.data;
        }
      }
    } catch (err) {
      usePost = false;
      console.log(
        `Unable to prefetch data using POST for ${baseUrl}/${prefetchValue}`,
        err,
      );
    }

    if (!usePost) {
      try {
        const result = await axios({
          method: 'GET',
          url: `${baseUrl}/${prefetchValue}`,
          headers,
        });
        if (result.data && Object.keys(result.data).length) {
          resultingPrefetch[key] = result.data;
        }
      } catch (err) {
        console.log(`Unable to prefetch data for ${baseUrl}/${prefetchValue}`, err);
      }
    }
  });

  // Wait for all promises to complete
  await Promise.all(promises);

  return resultingPrefetch;
}

/**
 * Create a request payload to send to a specified CDS Service endpoint. Data filled out will be based
 * on the current state of config stored. Send the request to specified CDS Service and store the
 * request and response accordingly.
 * @param url - CDS Service Endpoint to construct request payload for
 * @param context - Any context to relay to the CDS Service in the request via the context parameter
 * @returns {Promise} - Promise object to eventually return service response data
 */
function callServices(dispatch, state, url, context, exchangeRound = 0) {
  const hook = state.hookState.currentHook;
  const fhirServer = state.fhirServerState.currentFhirServer;

  const activityContext = {};
  activityContext.patientId = state.patientState.currentPatient.id;
  activityContext.userId = state.patientState.currentUser || state.patientState.defaultUser;

  if (context && context.length) {
    context.forEach((contextKey) => {
      activityContext[contextKey.key] = contextKey.value;
    });
  }

  const hookInstance = uuidv4();
  const accessTokenProperty = state.fhirServerState.accessToken;
  let fhirAuthorization;
  if (accessTokenProperty) {
    fhirAuthorization = {
      access_token: accessTokenProperty.access_token,
      token_type: 'Bearer',
      expires_in: accessTokenProperty.expires_in,
      scope: allScopes,
      subject: productionClientId,
    };
  }
  const request = {
    hookInstance,
    hook,
    fhirServer,
    context: activityContext,
  };

  if (fhirAuthorization) {
    request.fhirAuthorization = fhirAuthorization;
  }

  const serviceDefinition = state.cdsServicesState.configuredServices[url];

  const sendRequest = () => axios({
    method: 'post',
    url,
    data: request,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${generateJWT(url)}`,
    },
  });

  const dispatchResult = (result) => {
    if (result.data && Object.keys(result.data).length) {
      dispatch(storeExchange(url, request, result.data, result.status, exchangeRound));
      remapSmartLinks({
        dispatch,
        cardResponse: result.data,
        fhirAccessToken: state.fhirServerState.accessToken,
        patientId: state.patientState.currentPatient.id,
        fhirServerUrl: state.fhirServerState.currentFhirServer,
      });
    } else {
      dispatch(storeExchange(
        url,
        request,
        'No response returned. Check developer tools for more details.',
      ));
    }
  };

  const dispatchErrors = (err) => {
    console.error(`Could not POST data to CDS Service ${url}`, err);
    dispatch(storeExchange(
      url,
      request,
      'Could not get a response from the CDS Service. '
            + 'See developer tools for more details',
    ));
  };

  // Wait for prefetch to be fulfilled before making a request to the CDS service, if the service has prefetch expectations
  const needPrefetch = serviceDefinition.prefetch
        && Object.keys(serviceDefinition.prefetch).length > 0;

  const prefetchPromise = needPrefetch
    ? prefetchDataPromises(state, fhirServer, serviceDefinition.prefetch)
    : Promise.resolve({});

  return prefetchPromise.then((prefetchResults) => {
    if (prefetchResults && Object.keys(prefetchResults).length > 0) {
      request.prefetch = prefetchResults;
    }
    return sendRequest()
      .then(dispatchResult)
      .catch(dispatchErrors);
  });
}

export default callServices;
