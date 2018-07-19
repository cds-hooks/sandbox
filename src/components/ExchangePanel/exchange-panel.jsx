import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Card from 'terra-card';
import Heading from 'terra-heading';
import Toggle from 'terra-toggle/lib/Toggle';
import IconChevronRight from 'terra-icon/lib/icon/IconChevronRight';
import IconChevronDown from 'terra-icon/lib/icon/IconChevronDown';

import styles from './exchange-panel.css';

const propTypes = {
  /**
   * Flag to determine if the exchange panel is collapsed or expanded
   */
  isExpanded: PropTypes.bool.isRequired,
  /**
   * Text to display in the exchange panel body (i.e. JSON-stringified request or response from CDS service)
   */
  panelText: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  /**
   * Text to display in the exchange panel header
   */
  panelHeader: PropTypes.string.isRequired,
};

/**
 * Component representing a single CDS Developer panel
 */
class ExchangePanel extends Component {
  constructor(props) {
    super(props);

    this.state = ({
      isExpanded: this.props.isExpanded,
    });

    this.toggleExpansion = this.toggleExpansion.bind(this);
  }

  /**
   * Toggles the body display of a single context view panel (i.e. shows/hides the request panel)
   */
  toggleExpansion() {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  render() {
    const text = this.props.panelText ? JSON.stringify(this.props.panelText, null, 2).split(/\n/) : '';
    const textHtml = text ? text.map((l, i) => (
      <div key={`${l}-${i}`}>{l}</div>
    )) : '';

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
          <Card.Body>
            <div className={cx(styles['fhir-view'], styles['panel-text'], styles['panel-height'])}>
              <pre>
                {textHtml}
              </pre>
            </div>
          </Card.Body>
        </Toggle>
      </Card>
    );
  }
}

ExchangePanel.propTypes = propTypes;

export default ExchangePanel;
