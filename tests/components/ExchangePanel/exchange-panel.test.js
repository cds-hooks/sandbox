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
    const { container } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    // Accordion, AccordionSummary, AccordionDetails all render in the DOM
    expect(screen.getByText(panelHeader)).toBeInTheDocument();
    expect(container.querySelector('.panel-text')).toBeInTheDocument();
  });

  it('should have correct expansion state', () => {
    const { container, unmount } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    // When expanded, the accordion region should be visible
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).toBeInTheDocument();

    unmount();
    const { container: container2 } = render(<ExchangePanel panelHeader={panelHeader}
                            panelText={panelText}
                            isExpanded={false} />);
    expect(container2.querySelector('.MuiAccordion-root.Mui-expanded')).not.toBeInTheDocument();
  });

  it('should have state', () => {
    const { container } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    // Verify expanded state via the rendered DOM
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).toBeInTheDocument();
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
    const { container } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).toBeInTheDocument();
    // Click the accordion summary to toggle
    fireEvent.click(screen.getByText(panelHeader));
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).not.toBeInTheDocument();
  });

  it('should generate a div for each line of the JSON stringified panel text', () => {
    const { container } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    const divs = container.querySelectorAll('.panel-text pre div');
    expect(divs).toHaveLength(3);
  });

  it('should not generate any divs for empty panel text', () => {
    panelText = '';
    const { container } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    const divs = container.querySelectorAll('.panel-text pre div');
    expect(divs).toHaveLength(0);
  });
});
