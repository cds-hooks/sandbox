import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import intlContexts from './intl-context-setup';

describe('PatientEntry component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
  console.error = jest.fn();

  let ConnectedView;
  let PatientEntryView;
  let mockSpy;
  let mockResolve;
  let mockClosePrompt;
  let isEntryRequired;

  function setup(state) {
    mockStore = mockStoreWrapper(state);
    jest.setMock('../../../src/retrieve-data-helpers/patient-retrieval', mockSpy);
    ConnectedView = require('../../../src/components/PatientEntry/patient-entry').default;
    PatientEntryView = require('../../../src/components/PatientEntry/patient-entry')['PatientEntry'];
    let component;
    if (mockResolve && mockClosePrompt) {
      component = <ConnectedView store={mockStore}
                                 resolve={mockResolve}
                                 isOpen={true}
                                 isEntryRequired={isEntryRequired}
                                 closePrompt={mockClosePrompt} />
    } else {
      component = <ConnectedView store={mockStore}/>;
    }
    wrapper = shallow(component, intlContexts.shallowContext);
    pureComponent = wrapper.find(PatientEntryView);
  }

  beforeEach(() => {
    storeState = {
      patientState: {
        currentPatient: { id: 'test-1' }
      },
      fhirServerState: { currentFhirServer: 'http://test-fhir.com' },
      patients: ["test-1", "test-2", "test-3"],
    };
    mockSpy = jest.fn();
    mockResolve = jest.fn();
    mockClosePrompt = jest.fn();
    isEntryRequired = true;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('matches props passed down from Redux decorator', () => {
    setup(storeState);
    expect(pureComponent.prop('currentFhirServer')).toEqual(storeState.fhirServerState.currentFhirServer);
    expect(pureComponent.prop('currentPatientId')).toEqual(storeState.patientState.currentPatient.id);
  });

  it('changes isOpen state property if props changes for the property', () => {
    setup(storeState);
    let component = pureComponent.shallow();
    expect(component.state('isOpen')).toEqual(true);
    component.setProps({ isOpen: false });
    expect(component.state('isOpen')).toEqual(false);
  });

  it('handles closing the modal in the component', async () => {
    isEntryRequired = false;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    await shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').at(0).simulate('click');
    expect(mockClosePrompt).toHaveBeenCalled();
  });

  it('does not have cancel options on the modal if a patient is required', async () => {
    isEntryRequired = false;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    expect(await shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').length).toEqual(2);
  });

  describe('User input', () => {
    const enterInputAndSave = (shallowedComponent, input) => {
      shallowedComponent.find('PatientSelect').simulate('change', {'value': input});
      let x = shallowedComponent.find('PatientSelect');
      shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').last().simulate('click');
    };

    it('displays an error if input is empty', () => {
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      enterInputAndSave(shallowedComponent, '');
      expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
      expect(shallowedComponent.state('errorMessage')).not.toEqual('');
    });

    it('displays an error message if retrieving patient fails', () => {
      mockSpy = jest.fn(() => { throw new Error(1); });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      enterInputAndSave(shallowedComponent, 'test');
      expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
      expect(shallowedComponent.state('errorMessage')).not.toEqual('');
    });
  });
});
