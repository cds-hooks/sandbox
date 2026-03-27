import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import pickBy from 'lodash/pickBy';

import * as types from '../../../src/actions/action-types';

import ConnectedView, { ContextView } from '../../../src/components/ContextView/context-view';

describe('ServiceContextView component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
  let filteredServices;
  let patientServiceUrl;
  let medServiceUrl;

  beforeEach(() => {
    patientServiceUrl = 'http://example.com/cds-services/id-patient';
    medServiceUrl = 'http://example.com/cds-services/id-med-prescribe';
    storeState = {
      hookState: {
        isContextVisible: true,
        currentHook: 'patient-view',
      },
      cdsServicesState: {
        configuredServices: {
          [patientServiceUrl]: {
            hook: 'patient-view',
            url: patientServiceUrl,
            enabled: true,
          },
          [medServiceUrl]: {
            hook: 'order-select',
            url: medServiceUrl,
            enabled: true,
          },
        },
      },
      serviceExchangeState: {
        selectedService: patientServiceUrl,
        exchanges: {
          [patientServiceUrl]: {
            request: 'some-request',
            response: 'some-response'
          },
        },
      },
    };
    filteredServices = pickBy(storeState.cdsServicesState.configuredServices, (service) => {
      return service.hook === storeState.hookState.currentHook;
    });
    mockStore = mockStoreWrapper(storeState);
  });

  it('renders a connected component', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    expect(container).toBeDefined();
  });

  it('renders expected UI elements from Redux state', () => {
    render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    expect(screen.getAllByText('CDS Developer Panel').length).toBeGreaterThan(0);
    expect(screen.getByText('Select a Service')).toBeDefined();
    expect(screen.getAllByText(/Request/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Response/).length).toBeGreaterThan(0);
  });

  it('renders relevant child components (FormControl and ExchangePanel elements)', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    // FormControl renders in the DOM
    expect(screen.getByText('Select a Service')).toBeDefined();
    // Two ExchangePanel components render Request and Response headers
    expect(screen.getAllByText(/Request/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Response/).length).toBeGreaterThan(0);
  });

  it('does not have styling to display the context view on the user viewport if context visibility is false', () => {
    storeState.hookState.isContextVisible = false;
    mockStore = mockStoreWrapper(storeState);
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    // context-open class should not be present when isContextVisible is false
    const contextOpenElements = container.querySelectorAll('[class*="context-open"]');
    expect(contextOpenElements.length).toEqual(0);
  });

  describe('Field', () => {
    it('does not pre-select a service for the dropdown if there are no applicable services for the view', () => {
      storeState.hookState.currentHook = 'view-with-no-services';
      storeState.serviceExchangeState.selectedService = '';
      mockStore = mockStoreWrapper(storeState);
      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      // With no applicable services, the select should show placeholder text
      expect(screen.getByText('Select a service...')).toBeDefined();
    });

    it('preselects a service for the dropdown if there is at least one applicable service for the view', () => {
      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      // The selected service URL should appear in the rendered output
      expect(screen.getByText(patientServiceUrl)).toBeDefined();
    });
  });

  describe('ExchangePanel', () => {
    it('ensures the panel text contains a request/response if the service exchange has been stored', () => {
      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      let url = storeState.serviceExchangeState.selectedService;
      // The request and response text should be JSON-stringified and present in the DOM
      expect(screen.getByText(`"${storeState.serviceExchangeState.exchanges[url].request}"`)).toBeDefined();
      expect(screen.getByText(`"${storeState.serviceExchangeState.exchanges[url].response}"`)).toBeDefined();
    });

    it('ensures the panel text contains an appropriate message if service exchange has not been stored', () => {
      storeState.serviceExchangeState.selectedService = 'http://xyz-123.com/cds-services/id-1';
      mockStore = mockStoreWrapper(storeState);
      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      expect(screen.getByText('"No request made to CDS Service"')).toBeDefined();
      expect(screen.getByText('"No response made to CDS Service"')).toBeDefined();
    });
  });

  describe('Dispatch Props', () => {
    beforeEach(() => {
      mockStore.clearActions();
    });

    it('can dispatch an action via its dispatch function passed in as prop for toggled context view', () => {
      render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      const toggleButtons = screen.getAllByText('CDS Developer Panel');
      // The context-toggle button is the <button> element, not the <h1>
      const toggleButton = toggleButtons.find(el => el.tagName === 'BUTTON');
      fireEvent.click(toggleButton);
      const expectedAction = { type: types.SET_CONTEXT_VISIBILITY };
      expect(mockStore.getActions()).toEqual([expectedAction]);
    });
  });
});
