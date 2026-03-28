import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import * as types from '../../../../src/actions/action-types';

import ConnectedView, {ServiceDisplay} from '../../../../src/components/ConfigureServices/ServiceDisplay/service-display';

describe('ServiceDisplay component', () => {
  let storeState;
  let mockStoreWrapper = configureStore([]);
  let mockStore;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

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

  it('renders service definition and URL from props', () => {
    render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    expect(screen.getByText(url)).toBeInTheDocument();
  });

  it('toggles enabled status for a service if the toggle switch is changed', () => {
    render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(mockStore.getActions()).toEqual([{
      type: types.TOGGLE_SERVICE,
      service: url,
    }]);
  });

  it('deletes a configured service if the delete button is clicked', () => {
    render(
      <Provider store={mockStore}>
        <ConnectedView serviceUrl={url} definition={urlDefinition} />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(mockStore.getActions()).toEqual([{
      type: types.DELETE_SERVICE,
      service: url,
    }]);
  });
});
