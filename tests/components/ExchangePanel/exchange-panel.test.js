import React from 'react';
import { render, screen, fireEvent, cleanup } from '../../test-utils';

import ExchangePanel from '../../../src/components/ExchangePanel/exchange-panel';

describe('ExchangePanel component', () => {

  let panelHeader;
  let panelText;
  let container;
  let rerender;

  beforeEach(() => {
    panelHeader = 'Header';
    panelText = { test: 'test' };
    const rendered = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    container = rendered.container;
    rerender = rendered.rerender;
  });

  afterEach(() => {
    cleanup();
  });

  it('should render relevant child components', () => {
    expect(container.querySelectorAll('.MuiAccordion-root')).toHaveLength(1);
    expect(container.querySelectorAll('.MuiAccordionSummary-root')).toHaveLength(1);
    expect(container.querySelectorAll('.MuiAccordionDetails-root')).toHaveLength(1);
  });

  it('should have correct expansion state', () => {
    const accordion = container.querySelector('.MuiAccordion-root');
    expect(accordion).toHaveClass('Mui-expanded');

    const { container: container2 } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={false} />);
    const accordion2 = container2.querySelector('.MuiAccordion-root');
    expect(accordion2).not.toHaveClass('Mui-expanded');
  });

  it('should display the panel header', () => {
    expect(screen.getByText(panelHeader)).toBeInTheDocument();
  });

  it('should update state when the panel is expanded or collapsed', () => {
    const accordion = container.querySelector('.MuiAccordion-root');
    expect(accordion).toHaveClass('Mui-expanded');

    const summary = container.querySelector('.MuiAccordionSummary-root');
    fireEvent.click(summary);

    expect(accordion).not.toHaveClass('Mui-expanded');
  });

  it('should generate a div for each line of the JSON stringified panel text', () => {
    const preDivs = container.querySelectorAll('.panel-text pre div');
    expect(preDivs).toHaveLength(3);
  });

  it('should not generate any divs for empty panel text', () => {
    panelText = '';
    const { container: emptyContainer } = render(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    const preDivs = emptyContainer.querySelectorAll('.panel-text pre div');
    expect(preDivs).toHaveLength(0);
  });
});
