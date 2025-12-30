import React from 'react';
import { shallow, mount } from 'enzyme';

import ExchangePanel from '../../../src/components/ExchangePanel/exchange-panel';

describe('ExchangePanel component', () => {

  let wrapper;
  let panelHeader;
  let panelText;

  beforeEach(() => {
    panelHeader = 'Header';
    panelText = { test: 'test' };
    wrapper = shallow(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
  });

  it('should render relevant child components', () => {
    expect(wrapper.find('ForwardRef(Accordion)')).toHaveLength(1);
    expect(wrapper.find('ForwardRef(AccordionSummary)')).toHaveLength(1);
    expect(wrapper.find('ForwardRef(AccordionDetails)')).toHaveLength(1);
  });

  it('should have correct expansion state', () => {
    expect(wrapper.find('ForwardRef(Accordion)').prop('expanded')).toEqual(true);
    wrapper = shallow(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={false} />);
    expect(wrapper.find('ForwardRef(Accordion)').prop('expanded')).toEqual(false);
  });

  it('should have state', () => {
    expect(wrapper.state('isExpanded')).toEqual(true);
  });

  it('should have props', () => {
    wrapper = shallow(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    expect(wrapper.instance().props.isExpanded).toEqual(true);
    expect(wrapper.instance().props.panelText).toEqual(panelText);
    expect(wrapper.instance().props.panelHeader).toEqual(panelHeader);
  });

  it('should update state when the panel is expanded or collapsed', () => {
    expect(wrapper.state('isExpanded')).toEqual(true);
    wrapper.find('ForwardRef(Accordion)').simulate('change');
    expect(wrapper.state('isExpanded')).toEqual(false);
  });

  it('should generate a div for each line of the JSON stringified panel text', () => {
    expect(wrapper.find('.panel-text').find('pre').find('div')).toHaveLength(3);
  });

  it('should not generate any divs for empty panel text', () => {
    panelText = '';
    wrapper = shallow(<ExchangePanel panelHeader={panelHeader}
                                     panelText={panelText}
                                     isExpanded={true} />);
    expect(wrapper.find('.panel-text').find('pre').find('div')).toHaveLength(0);
  });
});
