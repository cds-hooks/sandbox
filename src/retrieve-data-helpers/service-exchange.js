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
 * ---- Prefetch utilities aligned with CDS Hooks spec (v3 ballot) ----
 *  - Prefetch tokens: {{context.foo}}, {{userPractitionerId}}, etc.
 *  - Simpler FHIRPath in tokens: {{today()}}, {{today() - 90 days}}
 *  - Basic advisory validation for prefetch query restrictions
 */
function formatDateYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveSimpleFhirPathTokens(str) {
  if (!str) { return str; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // {{ today() }} -> YYYY-MM-DD
  let out = str.replace(/\{\{\s*today\(\)\s*}}/gi, formatDateYYYYMMDD(today));
  // {{ today() +/- N days }} -> YYYY-MM-DD
  out = out.replace(/\{\{\s*today\(\)\s*([+-])\s*(\d+)\s*day[s]?\s*}}/gi, (m, sign, num) => {
    const n = parseInt(num, 10) || 0;
    const d = new Date(today);
    d.setDate(d.getDate() + (sign === '-' ? -n : n));
    return formatDateYYYYMMDD(d);
  });
  return out;
}

function deriveUserIdentifiers(userId) {
  const ids = {};
  if (typeof userId !== 'string') { return ids; }
  const parts = userId.split('/');
  if (parts.length === 2) {
    const [type, id] = parts;
    if (type === 'Practitioner') { ids.userPractitionerId = id; }
    if (type === 'PractitionerRole') { ids.userPractitionerRoleId = id; }
    if (type === 'Patient') { ids.userPatientId = id; }
    if (type === 'RelatedPerson') { ids.userRelatedPersonId = id; }
  }
  return ids;
}

function replaceContextTokens(template, activityContext = {}) {
  // Only replace first-level primitives from context per spec
  return template.replace(/\{\{\s*context\.([A-Za-z0-9_]+)\s*}}/g, (match, key) => {
    const val = activityContext[key];
    const isPrimitive = ['string', 'number', 'boolean'].includes(typeof val) || val === 0;
    return isPrimitive ? String(val) : match; // leave unresolved if not available
  });
}

function replaceUserIdentifierTokens(template, ids = {}) {
  return template
    .replace(/\{\{\s*userPractitionerId\s*}}/g, ids.userPractitionerId ?? '{{userPractitionerId}}')
    .replace(/\{\{\s*userPractitionerRoleId\s*}}/g, ids.userPractitionerRoleId ?? '{{userPractitionerRoleId}}')
    .replace(/\{\{\s*userPatientId\s*}}/g, ids.userPatientId ?? '{{userPatientId}}')
    .replace(/\{\{\s*userRelatedPersonId\s*}}/g, ids.userRelatedPersonId ?? '{{userRelatedPersonId}}');
}

function hasUnresolvedPrefetchTokens(template) {
  return /\{\{[^}]+}}/.test(template);
}

function validatePrefetchQuery(prefetchValue) {
  // Advisory checks per "Prefetch query restrictions" (non-blocking)
  try {
    const parts = prefetchValue.split('?');
    if (parts.length < 2) { return true; } // instance read or no query
    const usp = new URLSearchParams(parts[1]);
    Array.from(usp.entries()).forEach(([k, v]) => {
      // Allow token modifier :in, allow sort:asc/desc in key; warn on others
      if (k.includes(':') && !k.endsWith(':in') && !k.startsWith('sort:')) {
        console.warn(`Prefetch param "${k}" includes a modifier that may be unsupported by CDS Hooks query restrictions.`);
      }
      // Date prefixes eq, lt, gt, ge, le are typical; best-effort advisory only
      if ((k === 'date' || k === 'dateTime' || k === 'instant') && v && /^(ne|sa|eb)/.test(v)) {
        console.warn(`Date prefix in "${k}=${v}" may be outside recommended set (eq|lt|gt|ge|le).`);
      }
    });
  } catch (e) {
    console.warn('Could not validate prefetch query', e);
  }
  return true;
}

/**
 * Replace prefetch tokens using current context (patientId, userId, and any extra hook context)
 * and resolve simple FHIRPath date tokens.
 */
function completePrefetchTemplate(state, prefetch, activityContext = {}) {
  const patient = state.patientState?.currentPatient?.id;
  const user = state.patientState?.currentUser || state.patientState?.defaultUser;

  // Build a working context that includes required fields
  const ctx = { ...activityContext };
  if (patient && !ctx.patientId) { ctx.patientId = patient; }
  if (user && !ctx.userId) { ctx.userId = user; }

  const userIds = deriveUserIdentifiers(ctx.userId);

  const prefetchRequests = { ...prefetch };
  Object.keys(prefetchRequests).forEach((prefetchKey) => {
    let prefetchTemplate = String(prefetchRequests[prefetchKey] ?? '');

    // Backwards compatible replacements
    if (patient) {
      prefetchTemplate = prefetchTemplate.replace(/\{\{\s*context\.patientId\s*}}/g, patient);
    }
    if (user) {
      prefetchTemplate = prefetchTemplate.replace(/\{\{\s*user\s*}}/g, user);
      prefetchTemplate = prefetchTemplate.replace(/\{\{\s*context\.userId\s*}}/g, user);
    }

    // Spec-compliant replacements
    prefetchTemplate = replaceContextTokens(prefetchTemplate, ctx);
    prefetchTemplate = replaceUserIdentifierTokens(prefetchTemplate, userIds);

    // Resolve simple FHIRPath date tokens like {{today()}}, {{today() - 90 days}}
    prefetchTemplate = resolveSimpleFhirPathTokens(prefetchTemplate);

    // Encode values for querystring while preserving keys
    prefetchRequests[prefetchKey] = encodeUriParameters(prefetchTemplate);
  });

  return prefetchRequests;
}

/**
 * Fetch data from FHIR server for each prefetch request and return a Promise with the data resolved eventually
 *  - Supports instance-level reads (e.g., Patient/123)
 *  - Supports type-level searches via POST to _search first, then GET fallback
 *  - Skips unresolved templates that still contain tokens
 */
async function prefetchDataPromises(state, baseUrl, prefetch, activityContext = {}) {
  const resultingPrefetch = {};
  const prefetchRequests = { ...completePrefetchTemplate(state, prefetch, activityContext) };

  const headers = { Accept: 'application/json+fhir' };
  const { accessToken } = state.fhirServerState;
  if (accessToken && accessToken.access_token) {
    headers.Authorization = `Bearer ${accessToken.access_token}`;
  }

  const prefetchKeys = Object.keys(prefetchRequests);

  const promises = prefetchKeys.map(async (key) => {
    const prefetchValue = prefetchRequests[key];

    if (!prefetchValue || hasUnresolvedPrefetchTokens(prefetchValue)) {
      console.warn(`Skipping prefetch "${key}" due to unresolved tokens: ${prefetchValue}`);
      return;
    }

    validatePrefetchQuery(prefetchValue);

    const [path, query] = prefetchValue.split('?');
    const isSearch = Boolean(query);

    if (!isSearch) {
      // Instance level read (e.g., Patient/123)
      try {
        const result = await axios({
          method: 'GET',
          url: `${baseUrl}/${path}`,
          headers,
        });
        if (result.data && Object.keys(result.data).length) {
          resultingPrefetch[key] = result.data;
        }
      } catch (err) {
        console.log(`Unable to prefetch instance ${baseUrl}/${path}`, err);
      }
      return;
    }

    // Type level search; prefer POST to _search then fallback to GET
    const resourceType = path; // e.g., Observation
    const params = new URLSearchParams(query);
    let usePost = true;

    try {
      const result = await axios({
        method: 'POST',
        url: `${baseUrl}/${resourceType}/_search`,
        headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded' },
        data: params.toString(),
      });
      if (result.data && Object.keys(result.data).length) {
        resultingPrefetch[key] = result.data;
        return; // success via POST
      }
    } catch (err) {
      usePost = false;
      console.log(`Unable to prefetch data using POST for ${baseUrl}/${resourceType}/_search`, err);
    }

    if (!usePost) {
      try {
        const result = await axios({
          method: 'GET',
          url: `${baseUrl}/${path}?${params.toString()}`,
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
    ? prefetchDataPromises(state, fhirServer, serviceDefinition.prefetch, activityContext)
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
