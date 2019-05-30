import * as persist from '../../src/middleware/persist-data';

describe('Persist Data Middleware', () => {
  let createMock;

  const setup = (persistedMethod, mockStore) => {
    createMock = () => {
      const store = {
        getState: jest.fn(() => mockStore),
      };
      const next = jest.fn();
      const invoke = (action) => persistedMethod(store)(next)(action);

      return { store, next, invoke }
    };
  }

  afterEach(() => {
    localStorage.clear();
  })

  describe('Persist FHIR Server', () => {
    it('persists a FHIR server if the action is a FHIR server success action', () => {
      const store = {
        fhirServerState: {
          accessToken: null,
        },
      };
      setup(persist.persistFhirServer, store);
      expect(localStorage.getItem('PERSISTED_fhirServer')).toEqual(null);
      const { next, invoke } = createMock();
      const action = {
        type: 'GET_FHIR_SERVER_SUCCESS',
        baseUrl: 'http://example.com',
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_fhirServer')).toEqual('http://example.com');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('does not persist FHIR server if there is an access token stored on application state', () => {
      const store = {
        fhirServerState: {
          accessToken: '123',
        },
      };
      setup(persist.persistFhirServer, store);
      expect(localStorage.getItem('PERSISTED_fhirServer')).toEqual(null);
      const { next, invoke } = createMock();
      const action = {
        type: 'GET_FHIR_SERVER_SUCCESS',
        baseUrl: 'http://example.com',
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_fhirServer')).toEqual(null);
      expect(next).toHaveBeenCalledWith(action);
    });

    it('ignores setting localStorage for actions whose type is not GET_FHIR_SERVER_SUCCESS', () => {
      setup(persist.persistFhirServer);
      const baseUrl = 'http://example.com';
      localStorage.setItem('PERSISTED_fhirServer', baseUrl);
      const { next, invoke } = createMock();
      const action = {
        type: 'GET_FHIR_SERVER_FAILURE',
        baseUrl: 'http://other-example.com',
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_fhirServer')).not.toEqual('http://other-example.com');
      expect(next).toHaveBeenCalledWith(action);
    });
  });

  describe('Persist Patient', () => {
    beforeEach(() => { setup(persist.persistPatient); });
    it('persists a patient ID if the action is a patient success action', () => {
      expect(localStorage.getItem('PERSISTED_patientId')).toEqual(null);
      const { next, invoke } = createMock();
      const action = {
        type: 'GET_PATIENT_SUCCESS',
        patient: {
          id: '123',
        },
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_patientId')).toEqual('123');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('ignores actions whose type is not GET_PATIENT_SUCCESS', () => {
      const patientId = '123';
      localStorage.setItem('PERSISTED_patientId', patientId);
      const { next, invoke } = createMock();
      const action = {
        type: 'GET_PATIENT_FAILURE',
        patient: {
          id: '098',
        },
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_patientId')).not.toEqual('098');
      expect(next).toHaveBeenCalledWith(action);
    });
  });

  describe('Persist Hook', () => {
    beforeEach(() => { setup(persist.persistHook); })
    it('persists a hook name if the action is a set hook action', () => {
      expect(localStorage.getItem('PERSISTED_hook')).toEqual(null);
      const { next, invoke } = createMock();
      const action = {
        type: 'SET_HOOK',
        hook: 'order-select',
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_hook')).toEqual('order-select');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('ignores setting localStorage for actions whose type is not SET_HOOK', () => {
      const hook = 'order-select';
      localStorage.setItem('PERSISTED_hook', hook);
      const { next, invoke } = createMock();
      const action = {
        type: 'SOME_OTHER_ACTION',
        hook: 'some-other-hook',
      };

      invoke(action);
      expect(localStorage.getItem('PERSISTED_hook')).not.toEqual('some-other-hook');
      expect(next).toHaveBeenCalledWith(action);
    });
  });
});
