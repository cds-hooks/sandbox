import React, { Component } from 'react';
import cx from 'classnames';

import Card from 'terra-card';
import Heading from 'terra-heading';
import Toggle from 'terra-toggle/lib/Toggle';
import IconChevronRight from 'terra-icon/lib/icon/IconChevronRight';
import IconChevronDown from 'terra-icon/lib/icon/IconChevronDown';

import styles from './exchange-panel.css';

export default class ExchangePanel extends Component {
  constructor(props) {
    super(props);

    this.state = ({
      isExpanded: this.props.isExpanded,
    });

    this.toggleExpansion = this.toggleExpansion.bind(this);
  }

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
