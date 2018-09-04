import React from 'react';
import { mount, shallow } from 'enzyme';
import configureStore from 'redux-mock-store';

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
    jest.setMock('../../../src/retrieve-data-helpers/patientlist-retrieval', jest.fn(() => { return Promise.resolve([])} ));
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
    wrapper = shallow(component);
    pureComponent = wrapper.find(PatientEntryView);
  }

  beforeEach(() => {
    storeState = {
      patientState: {
        currentPatient: { id: 'test-patient' }
      },
      fhirServerState: { currentFhirServer: 'http://test-fhir.com' }
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
    let component = mount(<PatientEntryView isOpen={false} />);
    expect(component.prop('isOpen')).toEqual(false);
    component.setProps({ isOpen: true });
    expect(component.prop('isOpen')).toEqual(true);
  });

  it('handles closing the modal in the component', () => {
    mockResolve = null;
    mockClosePrompt = null;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    Promise.resolve(shallowedComponent).then(() => {
      shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').at(1).simulate('click');
      expect(shallowedComponent.state('isOpen')).toEqual(false);
    });
  });

  it('does not have cancel options on the modal if a patient is required', () => {
    isEntryRequired = false;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    Promise.resolve(shallowedComponent).then(() => {
      expect(shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').length).toEqual(2);
    });
  });

  describe('User input', () => {
    const enterInputAndSave = (shallowedComponent, input) => {
      shallowedComponent.find('BaseEntryBody').dive().find('Input').simulate('change', {'target': {'value': input}});
      shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').at(0).simulate('click');
    };

    it('displays an error if input is empty', () => {
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      Promise.resolve(shallowedComponent).then(() => {
        enterInputAndSave(shallowedComponent, '').then(() => {
          expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
          expect(shallowedComponent.state('errorMessage')).not.toEqual('');
        });
      });
    });

    it('displays an error message if retrieving patient fails', () => {
      mockSpy = jest.fn(() => { throw new Error(1); });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      Promise.resolve(shallowedComponent).then(() => {
        enterInputAndSave(shallowedComponent, 'test');
        expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
        expect(shallowedComponent.state('errorMessage')).not.toEqual('');
      });
    });

    it('closes the modal, resolves passed in prop promise if applicable, and closes prompt if possible', () => {
      mockSpy = jest.fn(() => { return Promise.resolve(1)} );
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      Promise.resolve(shallowedComponent).then(() => {
        enterInputAndSave(shallowedComponent, 'test');
        expect(shallowedComponent.state('shouldDisplayError')).toEqual(false);
        expect(shallowedComponent.state('isOpen')).toEqual(false);
        expect(mockResolve).toHaveBeenCalled();
        expect(mockClosePrompt).toHaveBeenCalled();
      });
    });
  });
});
