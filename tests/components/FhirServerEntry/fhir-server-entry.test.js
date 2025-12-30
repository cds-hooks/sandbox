import React from 'react';
import { mount, shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import intlContexts from './intl-context-setup';

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
    // wrapper = shallow(component);
    wrapper = shallow(component, intlContexts.shallowContext);
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
    // let component = mount(<FhirServerEntryView isOpen={false} />, { context: { intl }, childContextTypes: { intl: intlShape } });
    let component = pureComponent.shallow();
    expect(component.state('isOpen')).toEqual(true);
    component.setProps({ isOpen: false });
    expect(component.state('isOpen')).toEqual(false);
  });

  it('handles resetting the fhir server and closes the modal', async () => {
    isEntryRequired = false;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    await shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').at(0).simulate('click');
    expect(mockClosePrompt).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalled();
    expect(mockSpy).toHaveBeenCalled();
  });

  it('handles closing the modal in the component', async () => {
    isEntryRequired = false;
    setup(storeState);
    let shallowedComponent = pureComponent.shallow();
    await shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').at(1).simulate('click');
    expect(mockClosePrompt).toHaveBeenCalled();
  });

  describe('User input', () => {
    const enterInputAndSave = (shallowedComponent, input) => {
      shallowedComponent.find('BaseEntryBody').prop('inputOnChange')({'target': {'value': input}});
      shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').last().simulate('click');
    };

    it('displays an error if input is empty', () => {
      mockSpy = jest.fn(() => { Promise.resolve(1) });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      enterInputAndSave(shallowedComponent, '');
      expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
      expect(shallowedComponent.state('errorMessage')).not.toEqual('');
    });

    it('displays an error message if retrieving fhir server metadata fails', () => {
      mockSpy = jest.fn(() => { throw new Error(1); });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      enterInputAndSave(shallowedComponent, 'test');
      expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
      expect(shallowedComponent.state('errorMessage')).not.toEqual('');
    });

    it('displays an error message if input resolves to a 401 error', () => {
      mockSpy = jest.fn(() => { 
        throw new Error({
          response: { status: 401 },
        }); 
      });
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      enterInputAndSave(shallowedComponent, 'http://secured-fhir-endpoint.com');
      expect(shallowedComponent.state('shouldDisplayError')).toEqual(true);
      expect(shallowedComponent.state('errorMessage')).not.toEqual('');
    });

    it('closes the modal, resolves passed in prop promise if applicable, and closes prompt if possible', async () => {
      mockSpy = jest.fn(() => { return Promise.resolve(1)} );
      setup(storeState);
      let shallowedComponent = pureComponent.shallow();
      await enterInputAndSave(shallowedComponent, 'test');
      expect(shallowedComponent.state('shouldDisplayError')).toEqual(false);
      expect(mockClosePrompt).toHaveBeenCalled();
      expect(mockResolve).toHaveBeenCalled();
      expect(mockClosePrompt).toHaveBeenCalled();
    });
  });
});