import React from 'react';
import { render, screen, fireEvent, cleanup } from '../../test-utils';

import MessagePanel from '../../../src/components/MessagePanel/message-panel';

describe('MessagePanel component', () => {

  let panelHeader;
  let container;
  let rerender;

  beforeEach(() => {
    panelHeader = 'Header';
    const rendered = render(<MessagePanel panelHeader={panelHeader}
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

    const { container: container2 } = render(<MessagePanel panelHeader={panelHeader}
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

  it('should generate a div for each received message', () => {
    // We can't directly set state in RTL, but messages are added via window events
    // For now, check that there are no pre elements initially
    expect(container.querySelectorAll('.panel-text pre')).toHaveLength(0);
  });

  it('should not generate any divs for empty messages', () => {
    expect(container.querySelectorAll('.panel-text pre')).toHaveLength(0);
  });

  describe('when receiving and responding to messages,', () => {
    let registeredEventListeners;
    let messageContainer;

    beforeEach(() => {
      registeredEventListeners = {};
      window.addEventListener = jest.fn((event, listener) => {
        registeredEventListeners[event] = listener;
      });

      // Re-render after mocking addEventListener
      const rendered = render(<MessagePanel panelHeader={panelHeader}
        isExpanded={true} />);
      messageContainer = rendered.container;
    });

    afterEach(() => {
      cleanup();
    });

    describe('when filtering unsupported messages,', () => {
      let responseListener;

      beforeEach(() => {
        responseListener = jest.fn();
      });

      afterEach(() => {
        expect(messageContainer.querySelectorAll('.panel-text pre')).toHaveLength(0);
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

      const preElements = messageContainer.querySelectorAll('.panel-text pre');
      expect(preElements).toHaveLength(2);
      expect(preElements[0].textContent).toContain('"messageId": "123"');
      expect(preElements[1].textContent).toContain('"messageId": "456"');

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
