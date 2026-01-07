import React from 'react';
import { mount, shallow } from 'enzyme';
import intlContexts from './intl-context-setup';

describe('FhirServerEntry component', () => {
  let ServicesEntryView;
  let mockSpy;
  console.error = jest.fn();

  function setup() {
    jest.setMock('../../../src/retrieve-data-helpers/discovery-services-retrieval', mockSpy);
    ServicesEntryView = require('../../../src/components/ServicesEntry/services-entry').default;
  }

  beforeEach(() => {
    mockSpy = jest.fn(() => Promise.resolve(1));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('changes isOpen state property if props changes for the property', () => {
    setup();
    let component = shallow(<ServicesEntryView isOpen={false} />);
    expect(component.state('isOpen')).toEqual(false);
    component.setProps({ isOpen: true });
    expect(component.state('isOpen')).toEqual(true);
  });

  it('handles closing the modal in the component', async () => {
    const closePromptSpy = jest.fn();
    setup();
    let component = shallow(<ServicesEntryView isOpen={true} closePrompt={closePromptSpy} />);
    await component.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').at(0).simulate('click');
    expect(closePromptSpy).toHaveBeenCalled();
  });

  describe('User input', () => {
    const enterInputAndSave = (shallowedComponent, input) => {
      shallowedComponent.find('BaseEntryBody').prop('inputOnChange')({'target': {'value': input}});
      shallowedComponent.find('ForwardRef(DialogActions)').find('ForwardRef(Button)').at(1).simulate('click');
    };

    it('displays an error if input is empty', () => {
      mockSpy = jest.fn(() => { Promise.resolve(1) });
      setup();
      let component = shallow(<ServicesEntryView isOpen={true} />);
      enterInputAndSave(component, '');
      expect(component.state('shouldDisplayError')).toEqual(true);
      expect(component.state('errorMessage')).not.toEqual('');
    });

    it('displays an error message if retrieving discovery endpoint fails', () => {
      mockSpy = jest.fn(() => { throw new Error(1); });
      setup();
      let component = shallow(<ServicesEntryView isOpen={true} />);
      enterInputAndSave(component, 'test');
      expect(component.state('shouldDisplayError')).toEqual(true);
      expect(component.state('errorMessage')).not.toEqual('');
    });

    it('closes the modal, resolves passed in prop promise if applicable, and closes prompt if possible', async () => {
      const closePromptSpy = jest.fn();
      setup();
      let component = shallow(<ServicesEntryView isOpen={true} closePrompt={closePromptSpy} />);
      await enterInputAndSave(component, 'https://test.com');
      expect(component.state('shouldDisplayError')).toEqual(false);
      expect(closePromptSpy).toHaveBeenCalled();
    });
  });
});
