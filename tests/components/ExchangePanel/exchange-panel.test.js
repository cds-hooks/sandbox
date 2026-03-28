import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import ExchangePanel from '../../../src/components/ExchangePanel/exchange-panel';

describe('ExchangePanel component', () => {

  let panelHeader;
  let panelText;

  beforeEach(() => {
    panelHeader = 'Header';
    panelText = { test: 'test' };
  });

  it('should render relevant child components', () => {
    render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    // Accordion, AccordionSummary, AccordionDetails all render in the DOM
    expect(screen.getByText(panelHeader)).toBeInTheDocument();
    expect(screen.getByText(/"test": "test"/)).toBeInTheDocument();
  });

  it('should have correct expansion state', () => {
    // isExpanded is used as initial state, so test each value with a fresh render
    const { unmount } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    expect(screen.getByRole('button', { name: panelHeader })).toHaveAttribute('aria-expanded', 'true');

    unmount();
    render(<ExchangePanel panelHeader={panelHeader}
                            panelText={panelText}
                            isExpanded={false} />);
    expect(screen.getByRole('button', { name: panelHeader })).toHaveAttribute('aria-expanded', 'false');
  });

  it('should have state', () => {
    render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    // Verify expanded state via aria-expanded attribute
    expect(screen.getByRole('button', { name: panelHeader })).toHaveAttribute('aria-expanded', 'true');
  });

  it('should have props', () => {
    render(<ExchangePanel panelHeader={panelHeader}
                          panelText={panelText}
                          isExpanded={true} />);
    // Verify props are rendered correctly
    expect(screen.getByText(panelHeader)).toBeInTheDocument();
    // panelText is JSON stringified; check for the content
    expect(screen.getByText(/"test": "test"/)).toBeInTheDocument();
  });

  it('should update state when the panel is expanded or collapsed', () => {
    render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    const toggleButton = screen.getByRole('button', { name: panelHeader });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    // Click the accordion summary to toggle
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should display formatted JSON panel text', () => {
    render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    expect(screen.getByText(/"test": "test"/)).toBeInTheDocument();
  });

  it('should not display any content for empty panel text', () => {
    panelText = '';
    render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    expect(screen.queryByText(/"test"/)).not.toBeInTheDocument();
  });
});
