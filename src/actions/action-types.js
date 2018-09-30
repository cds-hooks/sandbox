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
export const SET_TEST_FHIR_SERVER = 'SET_TEST_FHIR_SERVER';

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
export const RESET_SERVICES = 'RESET_SERVICES';
export const TOGGLE_SERVICE = 'TOGGLE_SERVICE';
export const DELETE_SERVICE = 'DELETE_SERVICE';

// CDS Service Request/Response
export const SELECT_SERVICE_CONTEXT = 'SELECT_SERVICE_CONTEXT';
export const STORE_SERVICE_EXCHANGE = 'STORE_SERVICE_EXCHANGE';

// Misc UI actions
export const SET_LOADING_STATUS = 'SET_LOADING_STATUS';
export const SET_CONTEXT_VISIBILITY = 'SET_CONTEXT_VISIBILITY';

// Hooks
export const SET_HOOK = 'SET_HOOK';

// Card Demo
export const STORE_USER_CARD_JSON = 'STORE_USER_CARD_JSON';
export const TOGGLE_DEMO_VIEW = 'TOGGLE_DEMO_VIEW';

// Medication Select on RxView
export const STORE_USER_MED_INPUT = 'STORE_USER_MED_INPUT';
export const STORE_USER_CHOSEN_MEDICATION = 'STORE_USER_CHOSEN_MEDICATION';
export const STORE_USER_CONDITION = 'STORE_USER_CONDITION';
export const STORE_MED_DOSAGE_AMOUNT = 'STORE_MED_DOSAGE_AMOUNT';
export const STORE_DATE = 'STORE_DATE';
export const TOGGLE_DATE = 'TOGGLE_DATE';
export const UPDATE_FHIR_MEDICATION_ORDER = 'UPDATE_FHIR_MEDICATION_ORDER';

// Suggestions
export const TAKE_SUGGESTION = 'TAKE_SUGGESTION';

// User
export const SWITCH_USER = 'SWITCH_USER';
