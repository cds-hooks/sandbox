import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

import MessagePanel from '../../../src/components/MessagePanel/message-panel';

describe('MessagePanel component', () => {

  let panelHeader;

  beforeEach(() => {
    panelHeader = 'Header';
  });

  it('should render relevant child components', () => {
    const { container } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    expect(screen.getByText(panelHeader)).toBeInTheDocument();
    expect(container.querySelector('.MuiAccordion-root')).toBeInTheDocument();
  });

  it('should have correct expansion state', () => {
    const { container, unmount } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).toBeInTheDocument();

    unmount();
    const { container: container2 } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={false} />);
    expect(container2.querySelector('.MuiAccordion-root.Mui-expanded')).not.toBeInTheDocument();
  });

  it('should have state', () => {
    const { container } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).toBeInTheDocument();
  });

  it('should have props', () => {
    render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    expect(screen.getByText(panelHeader)).toBeInTheDocument();
  });

  it('should update state when the panel is expanded or collapsed', () => {
    const { container } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).toBeInTheDocument();
    fireEvent.click(screen.getByText(panelHeader));
    expect(container.querySelector('.MuiAccordion-root.Mui-expanded')).not.toBeInTheDocument();
  });

  it('should generate a div for each received message', () => {
    const { container } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);

    // Dispatch valid message events to add messages
    const source = { postMessage: jest.fn() };
    const messageData1 = { messageId: '123', messageType: 'scratchpad.update' };
    const messageData2 = { messageId: '456', messageType: 'scratchpad.create' };

    fireEvent(window, new MessageEvent('message', {
      data: messageData1,
      origin: 'https://smart-app.cds-service.net',
      source: source,
    }));

    fireEvent(window, new MessageEvent('message', {
      data: messageData2,
      origin: 'https://smart-app.cds-service.net',
      source: source,
    }));

    const preElements = container.querySelectorAll('.panel-text pre');
    expect(preElements).toHaveLength(2);
  });

  it('should not generate any divs for empty messages', () => {
    const { container } = render(<MessagePanel panelHeader={panelHeader}
      isExpanded={true} />);
    // No messages dispatched, so no pre elements
    const preElements = container.querySelectorAll('.panel-text pre');
    expect(preElements).toHaveLength(0);
  });

  describe('when receiving and responding to messages,', () => {
    let registeredEventListeners;

    beforeEach(() => {
      registeredEventListeners = {};
      window.addEventListener = jest.fn((event, listener) => {
        registeredEventListeners[event] = listener;
      });
    });

    afterEach(() => {
      jest.resetModules();
    });

    describe('when filtering unsupported messages,', () => {
      let responseListener;
      let container;

      beforeEach(() => {
        responseListener = jest.fn();
        const rendered = render(<MessagePanel panelHeader={panelHeader}
          isExpanded={true} />);
        container = rendered.container;
      });

      afterEach(() => {
        // No messages should have been added for unsupported messages
        const preElements = container.querySelectorAll('.panel-text pre');
        expect(preElements).toHaveLength(0);
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
      const { container } = render(<MessagePanel panelHeader={panelHeader}
        isExpanded={true} />);

      const messageData1 = { 'messageId': '123', 'messageType': 'scratchpad.update' };
      const responseListener1 = jest.fn();

      const messageData2 = { 'messageId': '456', 'messageType': 'scratchpad.create' };
      const responseListener2 = jest.fn();

      act(() => {
        sendMessage(messageData1, responseListener1);
      });
      act(() => {
        sendMessage(messageData2, responseListener2);
      });

      // Verify messages are rendered in the DOM
      const preElements = container.querySelectorAll('.panel-text pre');
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
        render(<MessagePanel panelHeader={panelHeader}
          isExpanded={true} />);

        const messageData = { 'messageId': '123', 'messageType': 'scratchpad.update' };

        sendMessage(messageData, responseListener);

        expect(responseListener).toHaveBeenCalled();
        expect(responseMessage.messageId).toBeDefined();
        expect(responseMessage.responseToMessageId).toEqual('123');
        expect(responseMessage.payload).toEqual({ "status": 200, "location": "https://resource-location/", "outcome": "Success" });
      });

      it('should respond to ui messages', () => {
        render(<MessagePanel panelHeader={panelHeader}
          isExpanded={true} />);

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
