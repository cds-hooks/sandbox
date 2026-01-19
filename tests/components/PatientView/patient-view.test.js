import React from 'react';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import configureStore from 'redux-mock-store';

describe('PatientView component', () => {
  let storeState;
  let mockStoreWrapper = configureStore([]);
  let mockSpy;

  beforeEach(() => {
    mockSpy = jest.fn();
    jest.setMock('../../../src/retrieve-data-helpers/service-exchange', mockSpy);
  });

  afterEach(() => {
    cleanup();
  });

  it('matches props passed down from Redux decorator', () => {
    const storeState = {
      hookState: { isContextVisible: true },
      patientState: {
        currentPatient: {
          name: 'Test',
          birthDate: '2000-01-01',
          id: 'test-patient'
        }
      },
      fhirServerState: { currentFhirServer: 'http://example-server.com' },
      cdsServicesState: {
        configuredServices: {
          'http://example.com/cds-services/id-1': {
            url: 'http://example.com/cds-services/id-1',
            id: 'id-1',
            hook: 'patient-view',
            enabled: true,
          }
        }
      },
      serviceExchangeState: {
        exchanges: {},
        hiddenCards: []
      }
    };
    const mockStore = mockStoreWrapper(storeState);
    const ConnectedView = require('../../../src/components/PatientView/patient-view').default;
    const { container } = renderWithProviders(
      <ConnectedView />,
      { store: mockStore }
    );
    // Component renders with patient data from Redux store
    expect(container.textContent).toContain(storeState.patientState.currentPatient.name);
  });

  it('contains relevant messages for missing patient in context', () => {
    const storeState = {
      hookState: {
        currentHook: 'patient-view',
        isContextVisible: true
      },
      patientState: {
        currentPatient: {}
      },
      fhirServerState: { currentFhirServer: 'http://example-server.com' },
      cdsServicesState: {
        configuredServices: {
          'http://example.com/cds-services/id-1': {
            url: 'http://example.com/cds-services/id-1',
            id: 'id-1',
            hook: 'patient-view',
            enabled: true,
          }
        }
      },
      serviceExchangeState: {
        exchanges: {},
        hiddenCards: []
      }
    };
    const mockStore = mockStoreWrapper(storeState);
    const ConnectedView = require('../../../src/components/PatientView/patient-view').default;
    const { container } = renderWithProviders(
      <ConnectedView />,
      { store: mockStore }
    );
    expect(container.textContent).toContain('Missing Name');
    expect(container.textContent).toContain('Missing DOB');
    expect(container.textContent).toContain('Missing Patient ID');
  });

  it('hides the view beyond the context toggle if context view status is set to false', () => {
    const storeState = {
      hookState: { isContextVisible: false },
      patientState: {
        currentPatient: {
          name: 'Test',
          birthDate: '2000-01-01',
          id: 'test-patient'
        }
      },
      fhirServerState: { currentFhirServer: 'http://example-server.com' },
      cdsServicesState: {
        configuredServices: {
          'http://example.com/cds-services/id-1': {
            url: 'http://example.com/cds-services/id-1',
            id: 'id-1',
            hook: 'patient-view',
            enabled: true,
          }
        }
      },
      serviceExchangeState: {
        exchanges: {},
        hiddenCards: []
      }
    };
    const mockStore = mockStoreWrapper(storeState);
    const ConnectedView = require('../../../src/components/PatientView/patient-view').default;
    const { container } = renderWithProviders(
      <ConnectedView />,
      { store: mockStore }
    );
    expect(container.querySelectorAll('.half-view')).toHaveLength(0);
  });

  it('does not call callServices on any services not configured for the patient view hook or display a Card', () => {
    const storeState = {
      hookState: { isContextVisible: true },
      patientState: {
        currentPatient: {
          name: 'Test',
          birthDate: '2000-01-01',
          id: 'test-patient'
        }
      },
      fhirServerState: { currentFhirServer: 'http://example-server.com' },
      cdsServicesState: { configuredServices: {} },
      serviceExchangeState: {
        exchanges: {},
        hiddenCards: []
      }
    };
    const mockStore = mockStoreWrapper(storeState);
    const ConnectedView = require('../../../src/components/PatientView/patient-view').default;
    const { container } = renderWithProviders(
      <ConnectedView />,
      { store: mockStore }
    );
    expect(mockSpy).toHaveBeenCalledTimes(0);
    // No cards should be rendered if there are no configured services
    const cards = container.querySelectorAll('.card');
    expect(cards.length).toEqual(0);
  });
});
