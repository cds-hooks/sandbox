import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

let mockServiceExchangeFn = jest.fn();

jest.mock('../../../src/retrieve-data-helpers/service-exchange', () => {
  return (...args) => mockServiceExchangeFn(...args);
});

// CardList uses store directly
jest.mock('../../../src/store/store', () => ({
  getState: () => ({}),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
}));

import ConnectedView from '../../../src/components/PatientView/patient-view';

describe('PatientView component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

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
    storeState = {
      hookState: { isContextVisible: true, currentHook: 'patient-view' },
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
        hiddenCards: {},
        launchLinks: {},
      },
    };
    mockServiceExchangeFn = jest.fn();
    mockStore = mockStoreWrapper(storeState);
  });

  it('contains relevant messages for missing patient in context', () => {
    storeState = {
      ...storeState,
      hookState: {
        currentHook: 'patient-view',
        isContextVisible: true
      },
      patientState: {
        currentPatient: {}
      },
    };
    mockStore = mockStoreWrapper(storeState);
    const { container } = renderComponent();
    expect(container.textContent).toContain('Missing Name');
    expect(container.textContent).toContain('Missing DOB');
    expect(container.textContent).toContain('Missing Patient ID');
  });

  it('hides the view beyond the context toggle if context view status is set to false', () => {
    const newStoreState = { ...storeState, hookState: { ...storeState.hookState, isContextVisible: false } };
    mockStore = mockStoreWrapper(newStoreState);
    const { container } = renderComponent();
    expect(container.querySelector('.half-view')).toBeFalsy();
  });

  it('does not call callServices on any services not configured for the patient view hook or display a Card', () => {
    const noServicesState = { ...storeState, cdsServicesState: { configuredServices: {} } };
    mockStore = mockStoreWrapper(noServicesState);
    const { container } = renderComponent();
    expect(mockServiceExchangeFn).toHaveBeenCalledTimes(0);
  });
});
