/**
 * Redux Actions
 *
 * This file serves to define the action constants that reducers use to filter out what logic to perform.
 * There should be an action for every change to the Redux store. An action can possibly handle one of more
 * reducer pieces of logic (i.e. GET_FHIR_SERVER_FAILURE may prompt Reducer X to update state to show an error banner
 * at the top of the page AND prompt Reducer Y to update state to display a modal to prompt the user for another
 * FHIR server).
 *
 * See more here: https://redux.js.org/docs/basics/Actions.html
 *
 */

// FHIR Server
export const GET_FHIR_SERVER_SUCCESS = 'GET_FHIR_SERVER_SUCCESS';
export const GET_FHIR_SERVER_FAILURE = 'GET_FHIR_SERVER_FAILURE';

// SMART Authentication
export const SMART_AUTH_SUCCESS = 'SMART_AUTH_SUCCESS';
export const SMART_AUTH_FAILURE = 'SMART_AUTH_FAILURE';

// Patient Context
export const GET_PATIENT_SUCCESS = 'GET_PATIENT_SUCCESS';
export const GET_PATIENT_FAILURE = 'GET_PATIENT_FAILURE';

// CDS Service Discovery
export const DISCOVER_CDS_SERVICES = 'DISCOVER_CDS_SERVICES';
export const DISCOVER_CDS_SERVICES_SUCCESS = 'DISCOVER_CDS_SERVICES_SUCCESS';
export const DISCOVER_CDS_SERVICES_FAILURE = 'DISCOVER_CDS_SERVICES_FAILURE';

// CDS Service Request/Response
export const STORE_SERVICE_EXCHANGE = 'STORE_SERVICE_EXCHANGE';
