import React from 'react';
import { shallow, mount } from 'enzyme';

import MessagePanel from '../../../src/components/MessagePanel/message-panel';

describe('MessagePanel component', () => {

  let wrapper;
  let panelHeader;

  beforeEach(() => {
    panelHeader = 'Header';
    wrapper = shallow(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
  });

  it('should render relevant child components', () => {
    expect(wrapper.find('Card')).toHaveLength(1);
    expect(wrapper.find('Heading')).toHaveLength(1);
    expect(wrapper.find('Toggle')).toHaveLength(1);
    expect(wrapper.find('IconChevronDown')).toHaveLength(1);
  });

  it('should render an icon indicating collapsed panel if specified', () => {
    wrapper = shallow(<MessagePanel panelHeader={panelHeader}
      isExpanded={false} />);
    expect(wrapper.find('IconChevronRight')).toHaveLength(1);
  });

  it('should have state', () => {
    expect(wrapper.state('isExpanded')).toEqual(true);
  });

  it('should have props', () => {
    wrapper = mount(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    expect(wrapper.prop('isExpanded')).toEqual(true);
    expect(wrapper.prop('panelHeader')).toEqual(panelHeader);
  });

  it('should update state when the panel is expanded or collapsed', () => {
    expect(wrapper.state('isExpanded')).toEqual(true);
    wrapper.find('Heading').simulate('click');
    expect(wrapper.state('isExpanded')).toEqual(false);
  });

  it('should generate a div for each received message', () => {
    wrapper.setState({ messages: ['{"messageId": "123", "messageType": "scratchpad.update"}', '{"messageId": "456", "messageType": "scratchpad.create"}'] });
    expect(wrapper.find('.panel-text').find('pre')).toHaveLength(2);
  });

  it('should not generate any divs for empty messages', () => {
    wrapper.setState({ messages: [] });
    expect(wrapper.find('.panel-text').find('pre')).toHaveLength(0);
  });

  describe('when receiving and responding to messages,', () => {
    let registeredEventListeners;

    beforeEach(() => {
      registeredEventListeners = {};
      window.addEventListener = jest.fn((event, listener) => {
        registeredEventListeners[event] = listener;
      });

      // Re-render after mocking addEventListener
      wrapper = shallow(<MessagePanel panelHeader={panelHeader}
        isExpanded={true} />);
    });

    afterEach(() => {
      jest.resetModules();
    });

    describe('when filtering unsupported messages,', () => {
      let responseListener;

      beforeEach(() => {
        responseListener = jest.fn();
      });

      afterEach(() => {
        expect(wrapper.state('messages')).toEqual([]);
        expect(responseListener).toHaveBeenCalledTimes(0);
      });

      it('should ignore messages that lack messageId', () => {
        sendMessage({ 'messageType': 'scratchpad.update' }, responseListener);
      });
  
      it('should ignore messages that lack messageType', () => {
        sendMessage({ 'messageId': '123' }, responseListener);
      });

      it('should ignore messages that lack supported messageTypes', () => {
        sendMessage({ 'messageId': '123', 'messageType': 'other.action' }, responseListener);
      });
    });

    it('should update state for each received message', () => {
      const messageData1 = { 'messageId': '123', 'messageType': 'scratchpad.update' };
      const responseListener1 = jest.fn();

      const messageData2 = { 'messageId': '456', 'messageType': 'scratchpad.create' };
      const responseListener2 = jest.fn();

      sendMessage(messageData1, responseListener1);
      sendMessage(messageData2, responseListener2);

      expect(wrapper.state('messages')).toEqual([JSON.stringify(messageData1, null, 2), JSON.stringify(messageData2, null, 2)]);

      expect(responseListener1).toHaveBeenCalled();
      expect(responseListener2).toHaveBeenCalled();
    });

    describe('when responding to specific message types,', () => {

      let responseListener;
      let responseMessage;

      beforeEach(() => {
        responseListener = jest.fn((message) => {
          responseMessage = message;
        });
      });

      it('should respond to scratchpad messages', () => {
        const messageData = { 'messageId': '123', 'messageType': 'scratchpad.update' };

        sendMessage(messageData, responseListener);

        expect(responseListener).toHaveBeenCalled();
        expect(responseMessage.messageId).toBeDefined();
        expect(responseMessage.responseToMessageId).toEqual('123');
        expect(responseMessage.payload).toEqual({ "status": 200, "location": "https://resource-location/", "outcome": "Success" });
      });

      it('should respond to ui messages', () => {
        const messageData = { 'messageId': '456', 'messageType': 'ui.done' };

        sendMessage(messageData, responseListener);

        expect(responseListener).toHaveBeenCalled();
        expect(responseMessage.messageId).toBeDefined();
        expect(responseMessage.responseToMessageId).toEqual('456');
        expect(responseMessage.payload).toEqual({ "success": true, "details": "Success" });
      });
    });

    function sendMessage(data, responseListener) {
      registeredEventListeners['message'](createMessageEvent(data, { postMessage: responseListener }));
    }

    function createMessageEvent(data, source) {
      return new MessageEvent('message', {
        data: data,
        origin: 'https://smart-app.cds-service.net',
        source: source
      });
    }
  });
});
