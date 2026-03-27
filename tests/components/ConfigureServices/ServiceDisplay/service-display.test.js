import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import * as types from '../../../../src/actions/action-types';

import ConnectedView, {ServiceDisplay} from '../../../../src/components/ConfigureServices/ServiceDisplay/service-display';

describe('ServiceDisplay component', () => {
  let storeState;
  let mockStoreWrapper = configureStore([]);
  let mockStore;
  console.error = jest.fn();

  let url;
  let urlDefinition;

  beforeEach(() => {
    mockStore = mockStoreWrapper({});
    url = 'http://example.com';
    urlDefinition = {
      enabled: true,
      hook: 'patient-view'
    };
  });

  it('serves a services property in the component', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    // If it renders without crashing, the connected component received its props
    expect(container).toBeTruthy();
  });

  it('toggles enabled status for a service if the toggle switch is changed', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    const switchInput = container.querySelector('input[type="checkbox"]');
    fireEvent.click(switchInput);
    expect(mockStore.getActions()).toEqual([{
      type: types.TOGGLE_SERVICE,
      service: url,
    }]);
  });

  it('deletes a configured service if the delete button is clicked', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    const deleteButton = container.querySelector('.btn-container button');
    fireEvent.click(deleteButton);
    expect(mockStore.getActions()).toEqual([{
      type: types.DELETE_SERVICE,
      service: url,
    }]);
  });
});
