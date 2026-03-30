import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import * as types from '../../../src/actions/action-types';

import { setHook } from '../../../src/actions/hook-actions';

const theme = createTheme();

let mockExchange = jest.fn();
let mockDiscoveryFn = jest.fn();
let mockFhirMetadataFn = jest.fn();
let mockPatientFn = jest.fn();

jest.mock('../../../src/retrieve-data-helpers/discovery-services-retrieval', () => {
  return (...args) => mockDiscoveryFn(...args);
});
jest.mock('../../../src/retrieve-data-helpers/fhir-metadata-retrieval', () => {
  return (...args) => mockFhirMetadataFn(...args);
});
jest.mock('../../../src/retrieve-data-helpers/patient-retrieval', () => {
  return (...args) => mockPatientFn(...args);
});
jest.mock('../../../src/retrieve-data-helpers/service-exchange', () => {
  return (...args) => mockExchange(...args);
});

// Mock the store module used by Header's switchHook
jest.mock('../../../src/store/store', () => {
  return {
    getState: () => mockStoreState,
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  };
});

// Mock all-patient-retrieval for PatientEntry
jest.mock('../../../src/retrieve-data-helpers/all-patient-retrieval', () => {
  return jest.fn(() => Promise.resolve([]));
});

let mockStoreState;

import ConnectedView from '../../../src/components/Header/header';

describe('Header component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  let mockPatientService;
  let mockMedService;

  // Helper to find the settings gear button (last IconButton in the toolbar)
  function getSettingsButton(container) {
    const buttons = container.querySelectorAll('button');
    const nonNavButtons = Array.from(buttons).filter(b => !b.classList.contains('nav-links') && !b.classList.contains('active-link'));
    return nonNavButtons[nonNavButtons.length - 1];
  }

  function renderComponent(storeOverride) {
    const s = storeOverride || mockStore;
    return render(
      <Provider store={s}>
        <ThemeProvider theme={theme}>
          <ConnectedView />
        </ThemeProvider>
      </Provider>
    );
  }

  beforeEach(() => {
    mockPatientService = 'http://example.com/cds-services/id-1';
    mockMedService = 'http://example-med.com/cds-services/id-1';
    storeState = {
      hookState: { currentHook: 'patient-view', currentScreen: 'patient-view' },
      patientState: { currentPatient: { id: 'patient-123' } },
      cardDemoState: {
        isCardDemoView: false,
      },
      fhirServerState: {
        accessToken: null,
      },
      cdsServicesState: {
        configuredServices: {
          [`${mockPatientService}`]: {
            hook: 'patient-view',
            enabled: true,
          },
          [`${mockMedService}`]: {
            hook: 'order-select',
            enabled: true,
          },
        },
      },
      medicationState: {
        decisions: {
          prescribable: null,
        },
        medListPhase: 'begin',
      }
    };
    mockStore = mockStoreWrapper(storeState);
    mockStoreState = storeState;
    mockExchange = jest.fn();
    mockDiscoveryFn = jest.fn();
    mockFhirMetadataFn = jest.fn(() => Promise.resolve());
    mockPatientFn = jest.fn(() => Promise.resolve());
  });

  afterEach(() => {
    if (mockStore) mockStore.clearActions();
  });

  describe('View tabs', () => {
    it('should only contain active links on the current hook/view', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.active-link').textContent).toEqual('Patient View');
      const allNavLinks = container.querySelectorAll('.nav-links');
      const nonActiveLinks = Array.from(allNavLinks).filter(el => !el.classList.contains('active-link'));
      expect(nonActiveLinks[0].textContent).toEqual('Rx View');
    });

    it('dispatches to switch hooks in app state if another view tab is clicked', () => {
      const { container } = renderComponent();
      const allNavLinks = container.querySelectorAll('.nav-links');
      const nonActiveLinks = Array.from(allNavLinks).filter(el => !el.classList.contains('active-link'));
      fireEvent.click(nonActiveLinks[0]);
      const medHookAction = { type: types.SET_HOOK, hook: 'order-select', screen: 'rx-view'};
      expect(mockStore.getActions()).toEqual([medHookAction]);
    });

    it('calls services if current hook is being invoked again on patient-view', () => {
      const { container } = renderComponent();
      fireEvent.click(container.querySelector('.active-link'));
      expect(mockExchange).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockPatientService);
    });

    it('does not call services on order-select if no medication is chosen yet', () => {
      storeState.hookState.currentHook = 'order-select';
      storeState.hookState.currentScreen = 'rx-view';
      mockStore = mockStoreWrapper(storeState);
      mockStoreState = storeState;
      const { container } = renderComponent();
      fireEvent.click(container.querySelector('.active-link'));
      expect(mockExchange).not.toHaveBeenCalled();
    });

    it('does call services on order-select if a medication has been chosen', () => {
      storeState.hookState.currentHook = 'order-select';
      storeState.hookState.currentScreen = 'rx-view';
      storeState.medicationState.decisions.prescribable = 'foo-medicine';
      storeState.medicationState.medListPhase = 'done';
      mockStore = mockStoreWrapper(storeState);
      mockStoreState = storeState;
      const { container } = renderComponent();
      fireEvent.click(container.querySelector('.active-link'));
      expect(mockExchange).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockMedService);
    });
  });

  it('should open and close settings menu when interacting with it', () => {
    const { container } = renderComponent();
    const settingsButton = getSettingsButton(container);
    fireEvent.click(settingsButton);
    // After clicking the settings button, menu items should appear
    expect(screen.getByRole('menu')).toBeInTheDocument();
    // Click a menu item to close the menu
    fireEvent.click(screen.getByText('Change Patient'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should display option to change FHIR server if no access token is configured for the application', () => {
    const { container } = renderComponent();
    const settingsButton = getSettingsButton(container);
    fireEvent.click(settingsButton);
    expect(screen.getByText('Change FHIR Server')).toBeInTheDocument();
  });

  it('should not display option to change FHIR server if an access token is configured for the application', () => {
    storeState = {
      ...storeState,
      fhirServerState: {
        accessToken: {
          serviceDiscoveryUrl: 'http://pre-configured-service.com/cds-services',
        },
      },
    };
    mockStore = mockStoreWrapper(storeState);
    mockStoreState = storeState;
    const { container } = renderComponent(mockStore);

    const settingsButton = getSettingsButton(container);
    fireEvent.click(settingsButton);
    expect(screen.queryByText('Change FHIR Server')).not.toBeInTheDocument();
  });

  describe('Change Patient', () => {
    it('should open the Change Patient dialog when the Change Patient option is clicked', () => {
      const { container } = renderComponent();
      const settingsButton = getSettingsButton(container);
      fireEvent.click(settingsButton);
      fireEvent.click(screen.getByText('Change Patient'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
    });
  });

  describe('Change FHIR Server', () => {
    it('should open the Change FHIR Server dialog when the Change FHIR Server option is clicked', () => {
      const { container } = renderComponent();
      const settingsButton = getSettingsButton(container);
      fireEvent.click(settingsButton);
      fireEvent.click(screen.getByText('Change FHIR Server'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Enter a FHIR Server URL/)).toBeInTheDocument();
    });
  });

  describe('Add Services', () => {
    it('should open the Add Services dialog when the Add Services option is clicked', () => {
      const { container } = renderComponent();
      const settingsButton = getSettingsButton(container);
      fireEvent.click(settingsButton);
      fireEvent.click(screen.getByText('Add CDS Services'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Enter discovery endpoint url/)).toBeInTheDocument();
    });
  });

  describe('Configure CDS Services', () => {
    it('should open the Configure CDS Services dialog when the Configure Services option is clicked', () => {
      const { container } = renderComponent();
      const settingsButton = getSettingsButton(container);
      fireEvent.click(settingsButton);
      fireEvent.click(screen.getByText('Configure CDS Services'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(mockPatientService)).toBeInTheDocument();
    });
  });

  describe('Reset Configuration', () => {
    it('should clear cached services if the Reset Configuration button is clicked', async () => {
      const { container } = renderComponent();
      localStorage.setItem('PERSISTED_patientId', 'patient-123');
      expect(localStorage.getItem('PERSISTED_patientId')).toEqual('patient-123');
      const settingsButton = getSettingsButton(container);
      fireEvent.click(settingsButton);
      fireEvent.click(screen.getByText('Reset Configuration'));
      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([{ type: types.RESET_SERVICES }])
      );
      // resetConfiguration is async; wait for localStorage to be cleared
      await waitFor(() => {
        expect(localStorage.getItem('PERSISTED_patientId')).toEqual(null);
      });
    });
  });
});
