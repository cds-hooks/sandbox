import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import ConnectedView, {CardDemo} from '../../../src/components/CardDemo/card-demo';
import * as types from '../../../src/actions/card-demo-actions';

describe('Card Demo component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  beforeEach(() => {
    storeState = {
      cardDemoState: {
        tempUserJson: null
      }
    };
    mockStore = mockStoreWrapper(storeState);
  });

  it('serves a services property in the component', () => {
    let component = shallow(<ConnectedView store={mockStore} />);
    expect(component.prop('tempUserJson')).toBeDefined();
  });

  it('does not contain an ErrorView component at start', () => {
    let component = shallow(<ConnectedView store={mockStore} />);
    let childComponent = component.find('CardDemo').shallow();
    expect(childComponent.find('.error-space').children().length).toEqual(0);
  });
});
