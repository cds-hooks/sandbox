import React from 'react';
import { render } from '@testing-library/react';
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

  it('renders connected component with Redux state', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    // Verify the connected component renders without errors
    expect(container.querySelector('.error-space')).toBeTruthy();
  });

  it('does not contain an ErrorView component at start', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView />
      </Provider>
    );
    const errorSpace = container.querySelector('.error-space');
    expect(errorSpace.children.length).toEqual(0);
  });
});
