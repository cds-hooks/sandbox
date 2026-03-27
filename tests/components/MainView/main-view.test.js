jest.mock('../../../keys/ecprivkey.pem');
jest.unmock('query-string');

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { setLoadingStatus } from '../../../src/actions/ui-actions';
import { setHook } from '../../../src/actions/hook-actions';

const theme = createTheme();

let mockPromiseSmartCall = jest.fn(() => Promise.resolve(1));
let mockPromiseFhirCall = jest.fn(() => Promise.resolve(1));
let mockPromisePatientCall = jest.fn(() => Promise.resolve(1));
let mockPromiseDiscoveryCall = jest.fn(() => Promise.resolve(1));
let mockServiceExchangeFn = jest.fn();

jest.mock('../../../src/retrieve-data-helpers/smart-launch', () => {
  return (...args) => mockPromiseSmartCall(...args);
});
jest.mock('../../../src/retrieve-data-helpers/fhir-metadata-retrieval', () => {
  return (...args) => mockPromiseFhirCall(...args);
});
jest.mock('../../../src/retrieve-data-helpers/patient-retrieval', () => {
  return (...args) => mockPromisePatientCall(...args);
});
jest.mock('../../../src/retrieve-data-helpers/discovery-services-retrieval', () => {
  return (...args) => mockPromiseDiscoveryCall(...args);
});
jest.mock('../../../src/retrieve-data-helpers/service-exchange', () => {
  return (...args) => mockServiceExchangeFn(...args);
});
jest.mock('../../../src/retrieve-data-helpers/all-patient-retrieval', () => {
  return jest.fn(() => Promise.resolve([]));
});

// Mock the store module used by Header and CardList
jest.mock('../../../src/store/store', () => ({
  getState: () => ({}),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
}));

import ConnectedMainView from '../../../src/components/MainView/main-view';

describe('MainView component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  function getFullStoreState(overrides = {}) {
    return {
      hookState: {
        currentHook: 'patient-view',
        currentScreen: 'patient-view',
        isLoadingData: false,
        isContextVisible: true,
      },
      cardDemoState: {
        isCardDemoView: false,
      },
      patientState: {
        currentPatient: {
          name: 'Test Patient',
          birthDate: '2000-01-01',
          id: 'patient-123',
        },
      },
      fhirServerState: {
        currentFhirServer: 'http://test-fhir.com',
        defaultFhirServer: 'http://default-fhir.com',
        accessToken: null,
      },
      cdsServicesState: {
        configuredServices: {},
      },
      serviceExchangeState: {
        exchanges: {},
        hiddenCards: {},
        launchLinks: {},
        selectedService: '',
      },
      medicationState: {
        decisions: { prescribable: null },
        medListPhase: 'begin',
        medicationInstructions: { number: '1', frequency: 'daily' },
        prescriptionDates: {
          start: { enabled: true, value: undefined },
          end: { enabled: true, value: undefined },
        },
        selectedConditionCode: '',
        filteredPrescribables: [],
        userInput: '',
      },
      ...overrides,
    };
  }

  function renderComponent(storeOverride) {
    const s = storeOverride || mockStore;
    return render(
      <Provider store={s}>
        <ThemeProvider theme={theme}>
          <ConnectedMainView />
        </ThemeProvider>
      </Provider>
    );
  }

  beforeEach(() => {
    storeState = getFullStoreState();
    mockStore = mockStoreWrapper(storeState);
    mockPromiseSmartCall = jest.fn(() => Promise.resolve(1));
    mockPromiseFhirCall = jest.fn(() => Promise.resolve(1));
    mockPromisePatientCall = jest.fn(() => Promise.resolve(1));
    mockPromiseDiscoveryCall = jest.fn(() => Promise.resolve(1));
    mockServiceExchangeFn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset URL to default after tests that use jsdom.reconfigure
    jsdom.reconfigure({ url: 'https://cds-client.org' });
    localStorage.clear();
  });

  it('renders relevant child components', async () => {
    let container;
    await act(async () => {
      ({ container } = renderComponent());
    });
    expect(container.querySelector('.pin')).toBeTruthy();
    expect(container.querySelector('.container')).toBeTruthy();
  });

  it('executes fhir metadata calls if smart launch auth was not successful', async () => {
    mockPromiseSmartCall = jest.fn(() => Promise.reject(0));
    await act(async () => {
      renderComponent();
    });
    expect(mockPromiseFhirCall).toHaveBeenCalled();
  });

  it('opens a fhir server entry prompt if fhir server call failed', async () => {
    mockPromiseSmartCall = jest.fn(() => Promise.reject(0));
    mockPromiseFhirCall = jest.fn(() => Promise.reject({
      response: { status: 401 },
    }));
    let container;
    await act(async () => {
      ({ container } = renderComponent());
    });
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    });
  });

  it('opens a patient entry modal if patient fetching failed', async () => {
    mockPromisePatientCall = jest.fn(() => Promise.reject(0));
    let container;
    await act(async () => {
      ({ container } = renderComponent());
    });
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    });
  });

  it('renders the med prescribe view if hook is not patient view', async () => {
    storeState = getFullStoreState({
      hookState: { currentHook: 'order-select', currentScreen: 'rx-view', isLoadingData: false, isContextVisible: true },
    });
    mockStore = mockStoreWrapper(storeState);
    let container;
    await act(async () => {
      ({ container } = renderComponent());
    });
    expect(container.querySelector('.rx-view')).toBeTruthy();
  });

  it('only renders the loading component if loading status is active', async () => {
    storeState = getFullStoreState({
      hookState: { isLoadingData: true, currentScreen: 'patient-view', currentHook: 'patient-view', isContextVisible: true },
    });
    mockStore = mockStoreWrapper(storeState);
    let container;
    await act(async () => {
      ({ container } = renderComponent());
    });
    expect(container.querySelector('.patient-view')).toBeFalsy();
  });

  it('calls a function to set the loading status on state on mount', async () => {
    await act(async () => {
      renderComponent();
    });
    const actions = mockStore.getActions();
    expect(actions[0]).toEqual(setLoadingStatus(true));
    expect(actions).toEqual(
      expect.arrayContaining([setLoadingStatus(false)])
    );
  });

  describe('Persisted State Values', () => {
    it('calls a function to set the hook status on state on mount from a persisted value on localStorage', async () => {
      localStorage.setItem('PERSISTED_hook', 'order-select');
      localStorage.setItem('PERSISTED_screen', 'rx-view');
      await act(async () => {
        renderComponent();
      });
      expect(mockStore.getActions()[1]).toEqual(setHook('order-select', 'rx-view'));
    });

    it('calls a function to set the hook status on state on mount to patient-view if no persisted hook value present on localStorage', async () => {
      localStorage.removeItem('PERSISTED_hook');
      localStorage.removeItem('PERSISTED_screen');
      await act(async () => {
        renderComponent();
      });
      expect(mockStore.getActions()[1]).toEqual(setHook('patient-view', 'patient-view'));
    });

    it('tries to discover any CDS Services from local storage', async () => {
      const persistedServices = ['http://persisted.com/cds-services'];
      localStorage.setItem('PERSISTED_cdsServices', JSON.stringify(persistedServices));
      await act(async () => {
        renderComponent();
      });
      await waitFor(() => {
        expect(mockPromiseDiscoveryCall).toHaveBeenCalledWith(persistedServices[0]);
      });
    });
  });

  describe('URL Parameter Values', () => {
    it('grabs the hook from the hook URL query parameter and sets it if its a known hook', async () => {
      jsdom.reconfigure({
        url: 'http://example.com/?hook=order-select&screen=rx-view',
      });
      await act(async () => {
        renderComponent();
      });
      expect(mockStore.getActions()[1]).toEqual(setHook('order-select', 'rx-view'));
    });

    it('sets stored local storage hook for unsupported hooks in the URL param', async () => {
      localStorage.setItem('PERSISTED_hook', 'order-select');
      localStorage.setItem('PERSISTED_screen', 'rx-view');
      jsdom.reconfigure({
        url: 'http://example.com/?hook=abc-123',
      });
      await act(async () => {
        renderComponent();
      });
      expect(mockStore.getActions()[1]).toEqual(setHook('order-select', 'rx-view'));
    });

    it('calls the discovery endpoints of service discovery URLs in query parameters', async () => {
      jsdom.reconfigure({
        url: 'http://example.com/?serviceDiscoveryURL=https://service-1.com/cds-services,foo.com/cds-services',
      });
      await act(async () => {
        renderComponent();
      });
      await waitFor(() => {
        expect(mockPromiseDiscoveryCall).toHaveBeenCalledWith('https://service-1.com/cds-services');
        expect(mockPromiseDiscoveryCall).toHaveBeenCalledWith('http://foo.com/cds-services');
      });
    });
  });
});
