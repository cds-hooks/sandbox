import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import * as types from '../../../src/actions/action-types';

import ConnectedView, { ContextView } from '../../../src/components/ContextView/context-view';

describe('ServiceContextView component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
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
    mockStore = mockStoreWrapper(storeState);
  });

  it('renders a connected component', () => {
    render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    expect(screen.getAllByText('CDS Developer Panel').length).toBeGreaterThan(0);
  });

  it('renders expected UI elements from Redux state', () => {
    render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    expect(screen.getAllByText('CDS Developer Panel').length).toBeGreaterThan(0);
    expect(screen.getByText('Select a Service')).toBeInTheDocument();
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
      expect(screen.getByText('Select a service...')).toBeInTheDocument();
    });

    it('preselects a service for the dropdown if there is at least one applicable service for the view', () => {
      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      // The selected service URL should appear in the rendered output
      expect(screen.getByText(patientServiceUrl)).toBeInTheDocument();
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
      expect(screen.getByText(`"${storeState.serviceExchangeState.exchanges[url].request}"`)).toBeInTheDocument();
      expect(screen.getByText(`"${storeState.serviceExchangeState.exchanges[url].response}"`)).toBeInTheDocument();
    });

    it('ensures the panel text contains an appropriate message if service exchange has not been stored', () => {
      storeState.serviceExchangeState.selectedService = 'http://xyz-123.com/cds-services/id-1';
      mockStore = mockStoreWrapper(storeState);
      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );
      expect(screen.getByText('"No request made to CDS Service"')).toBeInTheDocument();
      expect(screen.getByText('"No response made to CDS Service"')).toBeInTheDocument();
    });
  });

  describe('Dispatch Props', () => {
    beforeEach(() => {
      mockStore.clearActions();
    });

    it('can dispatch an action for selecting a service from the dropdown', () => {
      // Add a second patient-view service so there is something new to select
      const secondServiceUrl = 'http://example.com/cds-services/id-patient-2';
      storeState.cdsServicesState.configuredServices[secondServiceUrl] = {
        hook: 'patient-view',
        url: secondServiceUrl,
        enabled: true,
        id: 'id-patient-2',
      };
      storeState.cdsServicesState.configuredServices[patientServiceUrl].id = 'id-patient';
      mockStore = mockStoreWrapper(storeState);

      const { container } = render(
        <Provider store={mockStore}>
          <ConnectedView />
        </Provider>
      );

      // Open the react-select dropdown via keyboard navigation
      const selectInput = container.querySelector('input[id*="react-select"]');
      fireEvent.focus(selectInput);
      fireEvent.keyDown(selectInput, { key: 'ArrowDown' });
      // Move past the already-selected first option to the second
      fireEvent.keyDown(selectInput, { key: 'ArrowDown' });
      fireEvent.keyDown(selectInput, { key: 'Enter' });

      const expectedAction = { type: types.SELECT_SERVICE_CONTEXT, service: secondServiceUrl };
      expect(mockStore.getActions()).toContainEqual(expectedAction);
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
