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
      patientState: {
        currentPatient: {
          name: 'Test',
          birthDate: '2000-01-01',
          id: 'test-patient'
        }
      },
      cdsServicesState: {
        configuredServices: {
          'http://example.com/cds-services/id-1': {
            url: 'http://example.com/cds-services/id-1',
            id: 'id-1',
            hook: 'patient-view'
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

  it('renders a connected component and its unconnected counterpart', () => {
    expect(wrapper.length).toEqual(1);
    expect(pureComponent.length).toEqual(1);
  });

  it('matches props passed down from Redux decorator', () => {
    expect(pureComponent.prop('patient')).toEqual(storeState.patientState.currentPatient);
  });

  it('contains relevant patient information if patient is in context', () => {
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.text()).toContain(storeState.patientState.currentPatient.name);
    expect(shallowedComponent.text()).toContain(storeState.patientState.currentPatient.birthDate);
    expect(shallowedComponent.text()).toContain(storeState.patientState.currentPatient.id);
    expect(mockSpy).toHaveBeenCalledTimes(1);
  });

  it('contains relevant messages for missing patient in context', () => {
    storeState = {
      patientState: {
        currentPatient: {}
      },
      cdsServicesState: {
        configuredServices: {
          'http://example.com/cds-services/id-1': {
            url: 'http://example.com/cds-services/id-1',
            id: 'id-1',
            hook: 'patient-view'
          }
        }
      }
    };
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.text()).toContain('Missing Name');
    expect(shallowedComponent.text()).toContain('Missing DOB');
    expect(shallowedComponent.text()).toContain('Missing Patient ID');
    expect(mockSpy).toHaveBeenCalledTimes(1);
  });

  it('does not call callServices on any services not configured for the patient view hook', () => {
    const noServicesState = Object.assign({}, storeState, { 
      cdsServicesState: { configuredServices: {} } 
    });
    setup(noServicesState);
    let shallowedComponent = pureComponent.shallow();
    expect(mockSpy).toHaveBeenCalledTimes(0);
  });
});
