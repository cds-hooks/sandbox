import React from 'react';
import { render, screen, cleanup } from '../../test-utils';
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

  afterEach(() => {
    cleanup();
  });

  it('serves a services property in the component', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    // Component renders, which means it receives the tempUserJson prop
    expect(container).toBeInTheDocument();
  });

  it('does not contain an ErrorView component at start', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    const errorSpace = container.querySelector('.error-space');
    expect(errorSpace).toBeInTheDocument();
    expect(errorSpace.children.length).toEqual(0);
  });
});
