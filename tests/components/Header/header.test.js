import React from 'react';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import * as types from '../../../src/actions/action-types';

import { setHook } from '../../../src/actions/hook-actions';

describe('Header component', () => {
  let storeState;
  let wrapper;
  let mountedWrapper;
  let pureComponent;
  let shallowedComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  let mockPatientService;
  let mockMedService;
  let mockExchange;

  let ConnectedView;

  function setup(store) {
    mockStore = mockStoreWrapper(storeState);
    mockExchange = jest.fn();
    jest.setMock('../../../src/retrieve-data-helpers/discovery-services-retrieval', () => {return jest.fn();});
    jest.setMock('../../../src/retrieve-data-helpers/fhir-metadata-retrieval', () => {return jest.fn();});
    jest.setMock('../../../src/retrieve-data-helpers/patient-retrieval', () => {return jest.fn();});
    jest.setMock('../../../src/retrieve-data-helpers/service-exchange', mockExchange);
    jest.setMock('../../../src/store/store', mockStore);
    ConnectedView = require('../../../src/components/Header/header').default;
    let component = <ConnectedView store={mockStore} />;
    wrapper = shallow(component);
    mountedWrapper = mount(component);
    pureComponent = wrapper.find('Header');
    shallowedComponent = pureComponent.shallow();
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
  });

  afterEach(() => {
    mockStore.clearActions();
    jest.resetModules();
  });

  it('matches props passed down from Redux decorator', () => {
    setup(storeState);
    expect(pureComponent.prop('hook')).toEqual(storeState.hookState.currentHook);
    expect(pureComponent.prop('setHook')).toBeDefined();
  });

  describe('View tabs', () => {
    it('should only contain active links on the current hook/view', () => {
      setup(storeState);
      expect(shallowedComponent.childAt(0).dive().find('.active-link').text()).toEqual('Patient View');
      expect(shallowedComponent.childAt(0).dive().find('.nav-links').not('.active-link').first().text()).toEqual('Rx View');
    });

    it('dispatches to switch hooks in app state if another view tab is clicked', () => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.nav-links').not('.active-link').first().simulate('click');
      const medHookAction = { type: types.SET_HOOK, hook: 'order-select', screen: 'rx-view'};
      expect(mockStore.getActions()).toEqual([medHookAction]);
    });
  
    it('calls services if current hook is being invoked again on patient-view', () => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.active-link').simulate('click');
      expect(mockExchange).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockPatientService);
    });
  
    it('does not call services on order-select if no medication is chosen yet', () => {
      storeState.hookState.currentHook = 'order-select';
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.active-link').simulate('click');
      expect(mockExchange).not.toHaveBeenCalled();
    });

    it('does call services on order-select if a medication has been chosen', () => {
      storeState.hookState.currentHook = 'order-select';
      storeState.hookState.currentScreen = 'rx-view';
      storeState.medicationState.decisions.prescribable = 'foo-medicine';
      storeState.medicationState.medListPhase = 'done';
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.active-link').simulate('click');
      expect(mockExchange).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockMedService);
    });
  });

  it('should set open status for settings menu accordingly', async () => {
    setup(storeState);
    expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
    shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    expect(shallowedComponent.state('settingsOpen')).toBeTruthy();
    shallowedComponent.find('Menu').childAt(0).simulate('click');
    expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
  });

  it('should display option to change FHIR server if no access token is configured for the application', () => {
    setup(storeState);
    shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    expect(shallowedComponent.find('Menu').find('.change-fhir-server').key()).toEqual('change-fhir-server');
  });

  it('should not display option to change FHIR server if an access token is configured for the application', () => {
    setup(storeState);
    storeState = Object.assign({}, storeState, {
      ...storeState,
      fhirServerState: {
        accessToken: {
          serviceDiscoveryUrl: 'http://pre-configured-service.com/cds-services',
        },
      },
    });
    mockStore = mockStoreWrapper(storeState);
    let component = <ConnectedView store={mockStore} />;
    shallowedComponent = shallow(component).find('Header').shallow();

    shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    expect(shallowedComponent.find('Menu').find('.change-fhir-server').length).toEqual(0);
  });

  describe('Change Patient', () => {
    beforeEach(() => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    });

    it('should open the modal to change a patient if the Change Patient option is clicked directly', () => {
      shallowedComponent.find('Menu').find('.change-patient').simulate('click');
      expect(shallowedComponent.state('isChangePatientOpen')).toBeTruthy();
      expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
      expect(shallowedComponent.find('Connect(PatientEntry)').length).toEqual(1);
    });
  });

  describe('Change FHIR Server', () => {
    beforeEach(() => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    });

    it('should open the modal to change the FHIR server if the Change FHIR Server option is clicked directly', () => {
      shallowedComponent.find('Menu').find('.change-fhir-server').simulate('click');
      expect(shallowedComponent.state('isChangeFhirServerOpen')).toBeTruthy();
      expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
      expect(shallowedComponent.find('Connect(FhirServerEntry)').length).toEqual(1);
    });
  });

  describe('Add Services', () => {
    beforeEach(() => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    });

    it('should open the modal to add CDS Services if the Add Services option is clicked directly', () => {
      shallowedComponent.find('Menu').find('.add-services').simulate('click');
      expect(shallowedComponent.state('isAddServicesOpen')).toBeTruthy();
      expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
      expect(shallowedComponent.find('ServicesEntry').length).toEqual(1);
    });
  });

  describe('Configure CDS Services', () => {
    beforeEach(() => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    });

    it('should open the modal to add CDS Services if the Add Services option is clicked directly', () => {
      shallowedComponent.find('Menu').find('.configure-services').simulate('click');
      expect(shallowedComponent.state('isConfigureServicesOpen')).toBeTruthy();
      expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
      expect(shallowedComponent.find('Connect(ConfigureServices)').length).toEqual(1);
    });
  });

  describe('Reset Configuration', () => {
    beforeEach(() => {
      setup(storeState);
      shallowedComponent.childAt(0).dive().find('.icon').first().simulate('click');
    });

    it('should open the modal and clear cached services if the Reset Configuration button is clicked', async () => {
      localStorage.setItem('PERSISTED_patientId', 'patient-123');
      expect(localStorage.getItem('PERSISTED_patientId')).toEqual('patient-123');
      await shallowedComponent.find('Menu').find('.reset-configuration').simulate('click');
      expect(shallowedComponent.state('settingsOpen')).toBeFalsy();
      expect(mockStore.getActions()).toEqual([{ type: types.RESET_SERVICES }]);
      expect(localStorage.getItem('PERSISTED_patientId')).toEqual(null);
    });
  });
});
