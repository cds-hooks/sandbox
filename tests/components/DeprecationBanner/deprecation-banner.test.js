import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import DeprecationBanner, { DISMISS_KEY } from '../../../src/components/DeprecationBanner/deprecation-banner';

describe('DeprecationBanner component', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('renders the deprecation message by default', () => {
    render(<DeprecationBanner />);
    expect(screen.getByText(/FHIR DSTU2 \(R2\) is deprecated in this Sandbox/)).toBeTruthy();
  });

  it('does not render the message if previously dismissed', () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    render(<DeprecationBanner />);
    expect(screen.queryByText(/FHIR DSTU2 \(R2\) is deprecated in this Sandbox/)).toBeNull();
  });

  it('persists dismissal and hides the message when closed', async () => {
    const { container } = render(<DeprecationBanner />);
    fireEvent.click(container.querySelector('.MuiAlert-root button'));
    expect(localStorage.getItem(DISMISS_KEY)).toEqual('true');
    await waitFor(() => {
      expect(screen.queryByText(/FHIR DSTU2 \(R2\) is deprecated in this Sandbox/)).toBeNull();
    });
  });
});
