import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import pickBy from 'lodash/pickBy';

import * as types from '../../../src/actions/action-types';

import ConnectedView, { ContextView } from '../../../src/components/ContextView/context-view';
import { setContextVisiblity } from '../../../src/actions/ui-actions';
import { selectService } from '../../../src/actions/service-exchange-actions';

describe('ServiceContextView component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
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
          },
          [medServiceUrl]: {
            hook: 'medication-prescribe',
            url: medServiceUrl,
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
    let component = <ConnectedView store={mockStore}/>;
    wrapper = shallow(component);
    pureComponent = wrapper.find('ContextView');
  });

  it('renders a connected component and its unconnected counterpart', () => {
    expect(wrapper.length).toEqual(1);
    expect(pureComponent.length).toEqual(1);
  });

  it('matches props passed down from Redux decorator', () => {
    const serviceKeys = Object.keys(filteredServices);
    expect(pureComponent.prop('services')).toEqual(filteredServices);
    expect(pureComponent.prop('initialService')).toEqual(filteredServices[serviceKeys[0]]);
    expect(pureComponent.prop('isContextVisible')).toEqual(storeState.hookState.isContextVisible);
    expect(pureComponent.prop('selectedService')).toEqual(storeState.serviceExchangeState.selectedService);
    expect(pureComponent.prop('exchanges')).toEqual(storeState.serviceExchangeState.exchanges);
  });

  it('renders relevant child components', () => {
    const shallowComponent = pureComponent.shallow();
    expect(shallowComponent.find('SelectField')).toHaveLength(1);
    expect(shallowComponent.find('ExchangePanel')).toHaveLength(2);
  });

  it('does not have styling to display the context view on the user viewport if context visiblity is false', () => {
    storeState.hookState.isContextVisible = false;
    mockStore = mockStoreWrapper(storeState);
    let component = <ConnectedView store={mockStore} />;
    wrapper = shallow(component);
    pureComponent = wrapper.shallow();
    expect(wrapper.find('.context-open')).toHaveLength(0);
  });

  describe('SelectField', () => {
    it('does not pre-select a service for the dropdown if there are no applicable services for the view', () => {
      storeState.hookState.currentHook = 'view-with-no-services';
      storeState.serviceExchangeState.selectedService = '';
      mockStore = mockStoreWrapper(storeState);
      let component = <ConnectedView store={mockStore}/>;
      wrapper = mount(component);
      const selectDropdown = wrapper.find('SelectField');

      expect(selectDropdown.prop('options')).toEqual([]);
      expect(wrapper.prop('initialService')).toEqual(undefined);
    });

    it('preselects a service for the dropdown if there is at least one applicable service for the view', () => {
      let component = <ConnectedView store={mockStore}/>;
      wrapper = mount(component);
      const selectDropdown = wrapper.find('SelectField');
      expect(selectDropdown.prop('value')).toEqual(patientServiceUrl);
    });
  });

  describe('ExchangePanel', () => {
    it('ensures the panel text contains a request/response if the service exchange has been stored', () => {
      let component = <ConnectedView store={mockStore}/>;
      wrapper = mount(component);
      let url = storeState.serviceExchangeState.selectedService;
      const requestPanel = wrapper.find('ExchangePanel').first();
      const responsePanel = wrapper.find('ExchangePanel').last();
      expect(requestPanel.prop('panelText')).toEqual(storeState.serviceExchangeState.exchanges[url].request);
      expect(responsePanel.prop('panelText')).toEqual(storeState.serviceExchangeState.exchanges[url].response);
    });

    it('ensures the panel text contains an appropriate message if service exchange has not been stored', () => {
      storeState.serviceExchangeState.selectedService = '';
      mockStore = mockStoreWrapper(storeState);
      let component = <ConnectedView store={mockStore}/>;
      wrapper = mount(component);
      const requestPanel = wrapper.find('ExchangePanel').first();
      const responsePanel = wrapper.find('ExchangePanel').last();
      expect(requestPanel.prop('panelText')).toEqual('No request made to CDS Service');
      expect(responsePanel.prop('panelText')).toEqual('No response made to CDS Service');
    });
  });

  describe('Dispatch Props', () => {
    let newWrap;

    beforeEach(() => {
      newWrap = shallow(<ConnectedView store={mockStore} />);
      pureComponent = newWrap.find('ContextView').shallow();
    });

    it('can dispatch an action via its dispatch function passed in as prop for toggled context view', () => {
      pureComponent.find('.context-toggle').simulate('click');
      const expectedAction = { type: types.SET_CONTEXT_VISIBILITY };
      expect(mockStore.getActions()).toEqual([expectedAction]);
    });

    it('can dispatch an action via dispatch function passed in as a prop for selecting service', () => {
      pureComponent.find('SelectField').simulate('change', { target: { value: patientServiceUrl }});
      const expectedAction = { type: types.SELECT_SERVICE_CONTEXT, service:  patientServiceUrl};
      expect(mockStore.getActions()).toEqual([expectedAction]);
    });
  });
});