import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/medication-select-actions';

describe('Medication Select Actions', () => {
  it('creates action to store the users medication input box string', () => {
    const input = 'medicine';
    const expectedAction = {
      type: types.STORE_USER_MED_INPUT,
      input
    };

    expect(actions.storeUserMedInput(input))
      .toEqual(expectedAction);
  });

  it('creates action to store user selected medication', () => {
    const medication = { name: 'medicine', id: '123' };
    const expectedAction = {
      type: types.STORE_USER_CHOSEN_MEDICATION,
      medication,
    };

    expect(actions.storeUserChosenMedication(medication))
      .toEqual(expectedAction);
  });

  it('creates action to update the FHIR Medication Order resource', () => {
    const fhirVersion = '1.3.0';
    const patientId = '123';
    const expectedAction = {
      type: types.UPDATE_FHIR_MEDICATION_ORDER,
      fhirVersion,
      patientId,
    };

    expect(actions.updateFhirMedicationOrder(fhirVersion, patientId))
      .toEqual(expectedAction);
  });

  it('creates action to store user selected condition', () => {
    const condition = 'condition';
    const expectedAction = {
      type: types.STORE_USER_CONDITION,
      condition,
    };

    expect(actions.storeUserCondition(condition))
      .toEqual(expectedAction);
  });

  it('creates action to store user selected dosage amount', () => {
    const amount = 1;
    const frequency = 'daily';
    const expectedAction = {
      type: types.STORE_MED_DOSAGE_AMOUNT,
      amount,
      frequency,
    };

    expect(actions.storeMedDosageAmount(amount, frequency))
      .toEqual(expectedAction);
  });

  it('creates action to store user selected date', () => {
    const range = 'start';
    const date = '2018-04-12';
    const expectedAction = {
      type: types.STORE_DATE,
      range,
      date,
    };

    expect(actions.storeDate(range, date)).toEqual(expectedAction);
  });

  it('creates action to toggle the enabled state of the date', () => {
    const range = 'end';
    const expectedAction = {
      type: types.TOGGLE_DATE,
      range,
    };

    expect(actions.toggleDate(range)).toEqual(expectedAction);
  });
});
