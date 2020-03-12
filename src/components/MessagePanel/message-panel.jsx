import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Card from 'terra-card';
import Heading from 'terra-heading';
import Toggle from 'terra-toggle/lib/Toggle';
import IconChevronRight from 'terra-icon/lib/icon/IconChevronRight';
import IconChevronDown from 'terra-icon/lib/icon/IconChevronDown';

import styles from './message-panel.css';

const uuid = require('uuid/v4');

const propTypes = {
  /**
   * Flag to determine if the message panel is collapsed or expanded
   */
  isExpanded: PropTypes.bool.isRequired,

  /**
   * Text to display in the message panel header
   */
  panelHeader: PropTypes.string.isRequired,
};

/**
 * Component representing a Message panel
 */
class MessagePanel extends Component {
  constructor(props) {
    super(props);

    this.state = ({
      isExpanded: this.props.isExpanded,
      messages: [],
    });

    this.addMessage = this.addMessage.bind(this);
    this.replyMessage = this.replyMessage.bind(this);
    this.toggleExpansion = this.toggleExpansion.bind(this);
  }

  componentDidMount() {
    window.addEventListener('message', this.addMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.addMessage);
  }

  replyMessage(event) {
    let payloadStructure;

    const messageTarget = event.data.messageType.split('.');
    if (messageTarget[0] === 'scratchpad') {
      payloadStructure = {
        status: 200,
        location: 'https://resource-location/',
        outcome: 'Success',
      };
    } else if (messageTarget[0] === 'ui') {
      payloadStructure = {
        success: true,
        details: 'Success',
      };
    }

    const msgStructure = {
      messageId: uuid(),
      responseToMessageId: event.data.messageId,
      payload: payloadStructure,
    };

    event.source.postMessage(msgStructure, event.origin);
  }

  isActionableMessage(event) {
    // Ignore the event, if it doesn't meet our expectations.
    if (!event.data) return false;
    if (event.data.source === "react-devtools-bridge") return false;

    // TODO: why do the following check?
    if (event.origin.includes(document.domain)) {
      console.log(`Received message from ${event.origin} but it is the same as the current document's domain: ${document.domain}.`);
      return false;
    }

    if (!event.data.messageId) {
      console.log('Message has no messageId.');
      return false;
    }

    if (!event.data.messageType) {
      console.log('Message has no messageType.');
      return false;
    }

    const messageTarget = event.data.messageType.split('.');
    if (!['scratchpad', 'ui'].includes(messageTarget[0])) {
      console.log(`Unknown message type '${messageTarget[0]}.`);
      return false;
    }

    return true;
  }

  addMessage(event) {
    if (this.isActionableMessage(event)) {
      console.log('Adding a message to Message panel.', event);  // XXX
      const message = JSON.stringify(event.data, null, 2);
      // TODO: convert this to a stack so newer messages are on top.
      this.setState({ messages: [...this.state.messages, message] });
      this.replyMessage(event);
    }
  }

  /**
   * Toggles the body display of a single message view panel
   */
  toggleExpansion() {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  render() {
    const cards = this.state.messages.map((item, i) => (
      <Card.Body key={`card-${i}`}>
        <div key={`item-${i}`} className={cx(styles['fhir-view'], styles['panel-text'], styles['panel-height'])}>
          <pre>
            {item}
          </pre>
        </div>
      </Card.Body>
    ));

    const iconToggle = this.state.isExpanded ? <IconChevronDown /> : <IconChevronRight />;

    return (
      <Card>
        <Heading
          className={styles['header-toggle']}
          level={1}
          size="medium"
          weight={700}
          onClick={this.toggleExpansion}
        >
          {iconToggle}
          {this.props.panelHeader}
        </Heading>
        <Toggle isOpen={this.state.isExpanded} isAnimated>
          {cards}
        </Toggle>
      </Card>
    );
  }
}

MessagePanel.propTypes = propTypes;

export default MessagePanel;
