import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

describe('PatientView component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  let ConnectedView;
  let PatientView;
  let mockSpy;

  function setup(state) {
    mockStore = mockStoreWrapper(state);
    jest.setMock('../../../src/retrieve-data-helpers/service-exchange', mockSpy);
    ConnectedView = require('../../../src/components/PatientView/patient-view').default;
    PatientView = require('../../../src/components/PatientView/patient-view')['PatientView'];
    let component = <ConnectedView store={mockStore}/>;
    wrapper = shallow(component);
    pureComponent = wrapper.find(PatientView);
  }

  beforeEach(() => {
    storeState = {
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
      }
    };
    mockSpy = jest.fn();
    setup(storeState);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('matches props passed down from Redux decorator', () => {
    expect(pureComponent.prop('patient')).toEqual(storeState.patientState.currentPatient);
  });

  it('contains relevant messages for missing patient in context', () => {
    storeState = {
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
      }
    };
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.text()).toContain('Missing Name');
    expect(shallowedComponent.text()).toContain('Missing DOB');
    expect(shallowedComponent.text()).toContain('Missing Patient ID');
  });

  it('hides the view beyond the context toggle if context view status is set to false', () => {
    const newStoreState = Object.assign({}, storeState, { hookState: { isContextVisible: false } });
    setup(newStoreState);
    let shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.find('.half-view')).toHaveLength(0);
  });

  it('does not call callServices on any services not configured for the patient view hook or display a Card', () => {
    const noServicesState = Object.assign({}, storeState, { 
      cdsServicesState: { configuredServices: {} } 
    });
    setup(noServicesState);
    let shallowedComponent = pureComponent.shallow();
    expect(mockSpy).toHaveBeenCalledTimes(0);
    expect(shallowedComponent.find('Card').length).toEqual(0);
  });
});
