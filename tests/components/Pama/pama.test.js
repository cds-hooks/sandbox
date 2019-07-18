import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

describe('Pama component', () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  let ConnectedView;
  let Pama;
  let mockSpy;

  function setup(state) {
    mockStore = mockStoreWrapper(state);
    jest.setMock('../../../src/retrieve-data-helpers/service-exchange', mockSpy);
    ConnectedView = require('../../../src/components/Pama/pama').default;
    Pama = require('../../../src/components/Pama/pama')['Pama'];

    let component = <ConnectedView store={mockStore}/>;
    wrapper = shallow(component);
    pureComponent = wrapper.find(Pama);
  }

  beforeEach(() => {
    storeState = {
        pama: {
            serviceRequest: {
                code: 1,
                reasonCode: 2
            },
            pamaRating: "appropriate"
        }
    };
    mockSpy = jest.fn();
    setup(storeState);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('matches props passed down from Redux decorator', () => {
    expect(pureComponent.prop('pamaRating')).toEqual(storeState.pama.pamaRating);
    expect(pureComponent.prop('serviceRequest')).toEqual(storeState.pama.serviceRequest);
  });

});
