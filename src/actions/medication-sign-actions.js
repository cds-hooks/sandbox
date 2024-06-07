import * as types from './action-types';

/**
 * Sets the user input from the medication select input box
 * @param {*} input - User input string
 */
export function storeUserMedInput(input) {
  return {
    type: types.STORE_USER_MED_INPUT,
    input,
  };
}

/**
 * Sets the specific medication from the medication select input box
 * @param {*} medication - String of the medication ID
 */
export function storeUserChosenMedication(medication) {
  return {
    type: types.STORE_USER_CHOSEN_MEDICATION,
    medication,
  };
}

/**
 * Sets the medication amount and frequency set on the UI in the store
 * @param {*} amount - Dosage amount of the medication to take
 * @param {*} frequency - String dosage frequency of the medication
 */
export function storeMedDosageAmount(amount, frequency) {
  return {
    type: types.STORE_MED_DOSAGE_AMOUNT,
    amount,
    frequency,
  };
}

/**
 * Sets the dispense request on the UI in the store
 * @param {*} supplyDuration - Duration of the expected supply dispense
 */
export function storeDispenseRequest(supplyDuration) {
  return {
    type: types.STORE_DISPENSE_REQUEST,
    supplyDuration,
  };
}

/**
 * Sets the date for the medication to be taken at a specific time (range)
 * @param {*} range - String stating the date is the 'start' or 'end' date
 * @param {*} date - String of the date
 */
export function storeDate(range, date) {
  return {
    type: types.STORE_DATE,
    range,
    date,
  };
}

/**
 * Toggle the start or end date so that it is either included or excluded from the MedicationOrder FHIR object in the request
 * @param {*} range - String stating the date is the 'start' or 'end' date
 */
export function toggleDate(range) {
  return {
    type: types.TOGGLE_DATE,
    range,
  };
}

/**
 * Call service when sign order button is selected
 */
export function signOrder(event) {
  return {
    type: types.ORDER_SIGN_BUTTON_PRESS,
    event,
  };
}

/**
 * Takes action on the user-clicked suggestion from a card. The suggestion will be the suggestion chosen
 * from the CDS service response (exact format from specification).
 *
 * @param {*} suggestion - Object containing the suggestion chosen from the user (see format here: https://cds-hooks.org/specification/current/#suggestion)
 */
export function takeSuggestion(suggestion) {
  return {
    type: types.TAKE_SUGGESTION,
    suggestion,
  };
}
