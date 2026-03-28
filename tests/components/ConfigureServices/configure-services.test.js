import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ConnectedView, {ConfigureServices} from '../../../src/components/ConfigureServices/configure-services';

const theme = createTheme();

describe('ConfigureServices component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  let mockClosePrompt;

  beforeEach(() => {
    const url = 'http://example.com';
    const urlDefinition = {
      enabled: true,
      hook: 'patient-view'
    };
    storeState = {
      cdsServicesState: {
        configuredServices: {
          [url]: urlDefinition,
        },
      },
    };
    mockStore = mockStoreWrapper(storeState);
    mockClosePrompt = jest.fn();
  });

  it('serves a services property in the component', () => {
    render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConnectedView isOpen={true} />
        </ThemeProvider>
      </Provider>
    );
    // The connected component receives its services prop and renders the service URL
    expect(screen.getByText('http://example.com')).toBeInTheDocument();
  });

  it('changes isOpen state property if props changes for the property', () => {
    const { rerender } = render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConfigureServices isOpen={false} services={storeState.cdsServicesState.configuredServices} />
        </ThemeProvider>
      </Provider>
    );
    // Dialog should not be visible when isOpen is false
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConfigureServices isOpen={true} services={storeState.cdsServicesState.configuredServices} />
        </ThemeProvider>
      </Provider>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles closing the modal in the component', () => {
    const { getByText } = render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConfigureServices
            isOpen={true}
            closePrompt={mockClosePrompt}
            services={storeState.cdsServicesState.configuredServices}
          />
        </ThemeProvider>
      </Provider>
    );
    const cancelButton = getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockClosePrompt).toHaveBeenCalled();
  });
});
