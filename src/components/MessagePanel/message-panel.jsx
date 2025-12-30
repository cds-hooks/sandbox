import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import CardContent from '@mui/material/CardContent';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { IconChevronRight, IconChevronDown } from '../../utils/iconMapping';

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
    if (!event.data) { return false; }
    if ((event.data.source || '').startsWith('react-devtools-')) { return false; }

    if (!event.data.messageId) {
      console.warn('Message has no messageId.');
      return false;
    }

    if (!event.data.messageType) {
      console.warn('Message has no messageType.');
      return false;
    }

    const messageTarget = event.data.messageType.split('.');
    if (!['scratchpad', 'ui'].includes(messageTarget[0])) {
      console.warn(`Unknown message type '${messageTarget[0]}.`);
      return false;
    }

    return true;
  }

  addMessage(event) {
    if (this.isActionableMessage(event)) {
      const message = JSON.stringify(event.data, null, 2);
      // TODO(issue#129): convert this to a stack so newer messages are on top.
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
      <CardContent key={`card-${i}`}>
        <div key={`item-${i}`} className={cx(styles['fhir-view'], styles['panel-text'], styles['panel-height'])}>
          <pre>
            {item}
          </pre>
        </div>
      </CardContent>
    ));

    return (
      <Accordion expanded={this.state.isExpanded} onChange={this.toggleExpansion}>
        <AccordionSummary
          expandIcon={this.state.isExpanded ? <IconChevronDown /> : <IconChevronRight />}
          className={styles['header-toggle']}
        >
          <Typography variant="h6" fontWeight={700}>
            {this.props.panelHeader}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {cards}
        </AccordionDetails>
      </Accordion>
    );
  }
}

MessagePanel.propTypes = propTypes;

export default MessagePanel;
