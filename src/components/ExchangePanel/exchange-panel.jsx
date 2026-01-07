import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { IconChevronRight, IconChevronDown } from '../../utils/iconMapping';

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

    return (
      <Accordion
        expanded={this.state.isExpanded}
        onChange={this.toggleExpansion}
        disableGutters
      >
        <AccordionSummary
          expandIcon={this.state.isExpanded ? <IconChevronDown /> : <IconChevronRight />}
          className={styles['header-toggle']}
        >
          <Typography variant="h6" fontWeight={700}>
            {this.props.panelHeader}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <div className={cx(styles['fhir-view'], styles['panel-text'], styles['panel-height'])}>
            <pre>
              {textHtml}
            </pre>
          </div>
        </AccordionDetails>
      </Accordion>
    );
  }
}

ExchangePanel.propTypes = propTypes;

export default ExchangePanel;
