/* eslint-disable import/prefer-default-export */

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

export function storeUserChosenMedication(medication) {
  return {
    type: types.STORE_USER_CHOSEN_MEDICATION,
    medication,
  };
}

export function updateFhirMedicationOrder(fhirVersion, patientId) {
  return {
    type: types.UPDATE_FHIR_MEDICATION_ORDER,
    fhirVersion,
    patientId,
  };
}

export function storeUserCondition(condition) {
  return {
    type: types.STORE_USER_CONDITION,
    condition,
  };
}

export function storeMedDosageAmount(amount, frequency) {
  return {
    type: types.STORE_MED_DOSAGE_AMOUNT,
    amount,
    frequency,
  };
}

export function storeDate(range, date) {
  return {
    type: types.STORE_DATE,
    range,
    date,
  };
}

export function toggleDate(range) {
  return {
    type: types.TOGGLE_DATE,
    range,
  };
}

export function takeSuggestion(suggestion) {
  return {
    type: types.TAKE_SUGGESTION,
    suggestion,
  };
}
