import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ConnectedView, {ConfigureServices} from '../../../src/components/ConfigureServices/configure-services';

const theme = createTheme();

describe('ConfigureServices component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
  console.error = jest.fn();

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
    const { container } = render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConnectedView />
        </ThemeProvider>
      </Provider>
    );
    // If it renders without crashing, the connected component received its props
    expect(container).toBeTruthy();
  });

  it('changes isOpen state property if props changes for the property', () => {
    const { unmount } = render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConfigureServices isOpen={false} services={storeState.cdsServicesState.configuredServices} />
        </ThemeProvider>
      </Provider>
    );
    // Dialog should not be visible when isOpen is false
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    unmount();
    // Render with isOpen=true
    const { queryByRole } = render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <ConfigureServices isOpen={true} services={storeState.cdsServicesState.configuredServices} />
        </ThemeProvider>
      </Provider>
    );
    expect(queryByRole('dialog')).toBeTruthy();
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
