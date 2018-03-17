import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/patient-actions';

describe('Patient Actions', () => {
  it('creates action to signal a successful retrieval of a Patient resource', () => {
    const patient = { resourceType: 'Patient' };
    const expectedAction = {
      type: types.GET_PATIENT_SUCCESS,
      patient,
    };

    expect(actions.signalSuccessPatientRetrieval(patient)).toEqual(expectedAction);
  });

  it('creates action to signal a failed retrieval of a Patient resource', () => {
    const expectedAction = {
      type: types.GET_PATIENT_FAILURE,
    };

    expect(actions.signalFailurePatientRetrieval()).toEqual(expectedAction);
  });
});
