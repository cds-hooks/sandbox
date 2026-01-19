import React from 'react';
import { render, screen, fireEvent, cleanup } from '../../../test-utils';
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
  let container;

  beforeEach(() => {
    mockStore = mockStoreWrapper({});
    url = 'http://example.com';
    urlDefinition = {
      enabled: true,
      hook: 'patient-view'
    };
    const rendered = render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    container = rendered.container;
  });

  afterEach(() => {
    cleanup();
  });

  it('serves a services property in the component', () => {
    // Component renders successfully, which means props are passed correctly
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain(url);
  });

  it('toggles enabled status for a service if the toggle switch is changed', () => {
    const switchElement = container.querySelector('input[type="checkbox"]');
    fireEvent.click(switchElement);
    expect(mockStore.getActions()).toEqual([{
      type: types.TOGGLE_SERVICE,
      service: url,
    }]);
  });

  it('deletes a configured service if the delete button is clicked', () => {
    const deleteButton = container.querySelector('.btn-container button');
    fireEvent.click(deleteButton);
    expect(mockStore.getActions()).toEqual([{
      type: types.DELETE_SERVICE,
      service: url,
    }]);
  });
});
