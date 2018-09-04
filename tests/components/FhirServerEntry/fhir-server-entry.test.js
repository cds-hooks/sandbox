import React from 'react';
import { mount, shallow } from 'enzyme';
import configureStore from 'redux-mock-store';

describe('FhirServerEntry component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
  console.error = jest.fn();

  let ConnectedView;
  let FhirServerEntryView;
  let mockSpy;
  let mockResolve;
  let mockClosePrompt;
  let isEntryRequired;
  let initialError;
  let defaultFhirServer;

  function setup(state) {
    mockStore = mockStoreWrapper(state);
    jest.setMock('../../../src/retrieve-data-helpers/fhir-metadata-retrieval', mockSpy);
    ConnectedView = require('../../../src/components/FhirServerEntry/fhir-server-entry').default;
    FhirServerEntryView = require('../../../src/components/FhirServerEntry/fhir-server-entry')['FhirServerEntry'];
    let component;
    if (mockResolve && mockClosePrompt) {
      component = <ConnectedView store={mockStore} 
                                 resolve={mockResolve}
                                 isOpen={true}
                                 isEntryRequired={isEntryRequired} 
                                 initialError={initialError}
                                 defaultFhirServer={defaultFhirServer}
                                 closePrompt={mockClosePrompt} />
    } else {
      component = <ConnectedView store={mockStore}/>;
    }
    wrapper = shallow(component);
    pureComponent = wrapper.find(FhirServerEntryView);
  }

  beforeEach(() => {
    storeState = {
      fhirServerState: { 
        currentFhirServer: 'http://test-fhir.com',
        defaultFhirServer: 'http://default-fhir-server.com',
      },
    };
    mockSpy = jest.fn();
    mockResolve = jest.fn();
    mockClosePrompt = jest.fn();
    initialError = '';
    isEntryRequired = true;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('matches props passed down from Redux decorator', () => {
    setup(storeState);
    expect(pureComponent.prop('currentFhirServer')).toEqual(storeState.fhirServerState.currentFhirServer);
  });

  it('changes isOpen state property if props changes for the property', () => {
    setup(storeState);
    let component = mount(<FhirServerEntryView isOpen={false} />);
    Promise.resolve(component).then(() => {
      expect(component.prop('isOpen')).toEqual(false);
      component.setProps({ isOpen: true });
      expect(component.prop('isOpen')).toEqual(true);
    });
  });

  it('handles resetting the fhir server and closes the modal', async () => {
    isEntryRequired = false;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    Promise.resolve(shallowedComponent).then(() => {
      shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').at(0).simulate('click');
      expect(shallowedComponent.state('isOpen')).toEqual(false);
      expect(mockResolve).toHaveBeenCalled();
      expect(mockSpy).toHaveBeenCalled();
    });
  });

  it('handles closing the modal in the component', async () => {
    mockResolve = null;
    mockClosePrompt = null;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    Promise.resolve(shallowedComponent).then(() => {
      shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').at(2).simulate('click');
      expect(shallowedComponent.state('isOpen')).toEqual(false);
    });
  });

  describe('User input', () => {
    const enterInputAndSave = (shallowedComponent, input) => {
      shallowedComponent.find('BaseEntryBody').dive().find('Input').simulate('change', {'target': {'value': input}});
      shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').at(0).simulate('click');
    };

    it('displays an error if input is empty', () => {
      mockSpy = jest.fn(() => { Promise.resolve(1) });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      Promise.resolve(shallowedComponent).then(() => {
        enterInputAndSave(shallowedComponent, '');
        expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
        expect(shallowedComponent.state('errorMessage')).not.toEqual('');
      });
    });

    it('displays an error message if retrieving fhir server metadata fails', () => {
      mockSpy = jest.fn(() => { throw new Error(1); });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      Promise.resolve(shallowedComponent).then(() => {
        enterInputAndSave(shallowedComponent, 'test');
        expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
        expect(shallowedComponent.state('errorMessage')).not.toEqual('');
      });
    });

    it('displays an error message if input resolves to a 401 error', () => {
      mockSpy = jest.fn(() => { 
        throw new Error({
          response: { status: 401 },
        }); 
      });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      Promise.resolve(shallowedComponent).then(() => {
        enterInputAndSave(shallowedComponent, 'http://secured-fhir-endpoint.com');
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