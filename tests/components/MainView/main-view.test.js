jest.mock('../../../keys/ecprivkey.pem');

import React from 'react';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import {setLoadingStatus} from '../../../src/actions/ui-actions';

describe('MainView component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
  console.warn = jest.fn();

  let ConnectedMainView;
  let mockPromiseSmartCall = jest.fn();
  let mockPromiseFhirCall = jest.fn();
  let mockPromisePatientCall = jest.fn();
  let mockPromiseDiscoveryCall = jest.fn();

  function setup(state) {
    mockStore = mockStoreWrapper(state);
    jest.setMock('../../../src/retrieve-data-helpers/smart-launch', mockPromiseSmartCall);
    jest.setMock('../../../src/retrieve-data-helpers/fhir-metadata-retrieval', mockPromiseFhirCall);
    jest.setMock('../../../src/retrieve-data-helpers/patient-retrieval', mockPromisePatientCall);
    jest.setMock('../../../src/retrieve-data-helpers/discovery-services-retrieval', mockPromiseDiscoveryCall);
    ConnectedMainView = require('../../../src/components/MainView/main-view').default;
    wrapper = shallow(<ConnectedMainView store={mockStore} />);
    pureComponent = wrapper.find('MainView');
  }
 
  beforeEach(() => {
    storeState = {
      hookState: {
        currentHook: 'patient-view',
        isLoadingData: false,
      }
    }
    mockPromiseSmartCall.mockReturnValue(Promise.resolve(1));
    mockPromiseFhirCall.mockReturnValue(Promise.resolve(1));
    mockPromisePatientCall.mockReturnValue(Promise.resolve(1));
    mockPromiseDiscoveryCall.mockReturnValue(Promise.resolve(1));
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  })


  it('renders a connected component and its unconnected counterpart', () => {
    setup(storeState);
    expect(wrapper.length).toEqual(1);
    expect(pureComponent.length).toEqual(1);
  });

  it('renders relevant child components', () => {
    setup(storeState);
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.find('LoadingOverlay')).toHaveLength(1);
    // TODO: Add logic to check view when app can flex between med and patient view
    expect(shallowedComponent.find('Connect(PatientView)')).toHaveLength(1);
  });

  it('matches props passed down from Redux decorator', () => {
    setup(storeState);
    expect(pureComponent.prop('hook')).toEqual(storeState.hookState.currentHook);
    expect(pureComponent.prop('isLoadingData')).toEqual(storeState.hookState.isLoadingData);
  });

  it('executes fhir metadata calls if smart launch auth was not successful', (done) => {
    mockPromiseSmartCall = jest.fn(() => Promise.reject(0));
    setup(storeState);
    Promise.resolve(pureComponent.shallow()).then(() => {
      expect(mockPromiseFhirCall).toHaveBeenCalled();
      done();  
    });
  });

  it('renders the med prescribe view if hook is not patient view', () => {
    const newStore = Object.assign({}, storeState, { hookState: { currentHook: 'med-prescribe' } });
    setup(newStore);
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.childAt(1).text()).toEqual('Med Prescribe View');
  });

  it('only renders the loading component if loading status is active', () => {
    const newStore = Object.assign({}, storeState, { hookState: { isLoadingData: true } });
    setup(newStore);
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.find('Connect(PatientView')).toHaveLength(0);
  });

  it('calls a function to set the loading status on state on mount', () => {
    const shallowedComponent = pureComponent.shallow();
    expect(mockStore.getActions()[0]).toEqual(setLoadingStatus(true));
    expect(mockStore.getActions()[1]).toEqual(setLoadingStatus(false));
  });
});
