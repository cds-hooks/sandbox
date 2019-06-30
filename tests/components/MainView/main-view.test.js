jest.mock('../../../keys/ecprivkey.pem');
jest.dontMock('query-string');

import React from 'react';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import queryString from 'query-string';

import { setLoadingStatus } from '../../../src/actions/ui-actions';
import { setHook } from '../../../src/actions/hook-actions';

describe('MainView component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  let ConnectedMainView;
  let mockPromiseSmartCall = jest.fn(() => 1);
  let mockPromiseFhirCall = jest.fn(() => 1);
  let mockPromisePatientCall = jest.fn(() => 1);
  let mockPromiseDiscoveryCall = jest.fn(() => 1);

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
        currentScreen: 'patient-view',
        isLoadingData: false,
      },
      cardDemoState: {
        isCardDemoView: false,
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

  it('renders relevant child components', () => {
    setup(storeState);
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.find('LoadingOverlay')).toHaveLength(1);
    // TODO: Add logic to check view when app can flex between med and patient view
    expect(shallowedComponent.find('Connect(PatientView)')).toHaveLength(1);
    expect(shallowedComponent.find('Connect(ContextView)')).toHaveLength(1);
    expect(shallowedComponent.find('Connect(Header)')).toHaveLength(1);
  });

  it('matches props passed down from Redux decorator', () => {
    setup(storeState);
    expect(pureComponent.prop('screen')).toEqual(storeState.hookState.currentScreen);
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

  it('opens a fhir server entry prompt if fhir server call failed', async (done) => {
    mockPromiseSmartCall = jest.fn(() => Promise.reject(0));
    mockPromiseFhirCall = jest.fn(() => Promise.reject({
      response: { status: 401 },
    }));
    setup(storeState);
    let shallowedComponent = await pureComponent.shallow();
    Promise.resolve(shallowedComponent).then(() => {
      expect(shallowedComponent.state('fhirServerPrompt')).toEqual(true);
      expect(shallowedComponent.state('fhirServerIntialResponse')).not.toEqual('');
      done();
    });
  });

  it('opens a patient entry modal if patient fetching failed', async (done) => {
    mockPromisePatientCall = jest.fn(() => Promise.reject(0));
    setup(storeState);
    let shallowedComponent = await pureComponent.shallow();
    Promise.resolve( await shallowedComponent).then(async () => {
      await expect(shallowedComponent.state('patientPrompt')).toEqual(true);
      done();
    });
  });

  it('renders the med prescribe view if hook is not patient view', () => {
    const newStore = Object.assign({}, storeState, { hookState: { currentHook: 'order-select', currentScreen: 'rx-view' } });
    setup(newStore);
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.find('Connect(RxView)')).toHaveLength(1);
  });

  it('only renders the loading component if loading status is active', () => {
    const newStore = Object.assign({}, storeState, { hookState: { isLoadingData: true } });
    setup(newStore);
    const shallowedComponent = pureComponent.shallow();
    expect(shallowedComponent.find('Connect(PatientView')).toHaveLength(0);
    expect(shallowedComponent.find('Connect(ContextView)')).toHaveLength(0);
  });

  it('calls a function to set the loading status on state on mount', () => {
    const shallowedComponent = pureComponent.shallow();
    expect(mockStore.getActions()[0]).toEqual(setLoadingStatus(true));
    expect(mockStore.getActions()[2]).toEqual(setLoadingStatus(false));
  });

  describe('Persisted State Values', () => {
    it('calls a function to set the hook status on state on mount from a persisted value on localStorage', () => {
      localStorage.setItem('PERSISTED_hook', 'order-select');
      localStorage.setItem('PERSISTED_screen', 'rx-view');
      setup(storeState);
      const shallowedComponent = pureComponent.shallow();
      expect(mockStore.getActions()[1]).toEqual(setHook('order-select', 'rx-view'));
    });

    it('calls a function to set the hook status on state on mount to patient-view if no persisted hook value present on localStorage', () => {
      localStorage.removeItem('PERSISTED_hook');
      localStorage.removeItem('PERSISTED_screen');
      setup(storeState);
      const shallowedComponent = pureComponent.shallow();
      expect(mockStore.getActions()[1]).toEqual(setHook('patient-view', 'patient-view'));
    });

    it('tries to discover any CDS Services from local storage', async (done) => {
      const persistedServices = ['http://persisted.com/cds-services'];
      localStorage.setItem('PERSISTED_cdsServices', JSON.stringify(persistedServices));
      setup(storeState);
      const shallowedComponent = await pureComponent.shallow();
      Promise.resolve(await shallowedComponent).then(async () => {
        expect(await mockPromiseDiscoveryCall).toHaveBeenCalledWith(persistedServices[0]);
        done();
      });
    });
  });

  describe('URL Parameter Values', () => {
    it('grabs the hook from the hook URL query parameter and sets it if its a known hook', async () => {
      jsdom.reconfigure({
        url: 'http://example.com/?hook=order-select&screen=rx-view',
      });
      setup(storeState);
      const shallowedComponent = await pureComponent.shallow();
      expect(mockStore.getActions()[1]).toEqual(setHook('order-select', 'rx-view'));
    });

    it('sets stored local storage hook for unsupported hooks in the URL param', async () => {
      localStorage.setItem('PERSISTED_hook', 'order-select');
      localStorage.setItem('PERSISTED_screen', 'rx-view');
      jsdom.reconfigure({
        url: 'http://example.com/?hook=abc-123',
      });
      setup(storeState);
      const shallowedComponent = await pureComponent.shallow();
      expect(mockStore.getActions()[1]).toEqual(setHook('order-select', 'rx-view'));
    });

    it('calls the discovery endpoints of service discovery URLs in query parameters', async (done) => {
      jsdom.reconfigure({
        url: 'http://example.com/?serviceDiscoveryURL=https://service-1.com/cds-services,foo.com/cds-services',
      });
      setup(storeState);
      const shallowedComponent = await pureComponent.shallow();
      Promise.resolve(await shallowedComponent).then(async () => {
        expect(await mockPromiseDiscoveryCall).toHaveBeenCalledWith('https://service-1.com/cds-services');
        expect(await mockPromiseDiscoveryCall).toHaveBeenCalledWith('http://foo.com/cds-services');
        done();
      });
    });
  });
});
