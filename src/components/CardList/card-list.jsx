/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import cx from 'classnames';
import axios from 'axios';

import TerraCard from 'terra-card';
import Text from 'terra-text';
import Button from 'terra-button';

import styles from './card-list.css';
import {
  getServicesByHook,
  getCardsFromServices,
} from '../../reducers/helpers/services-filter';
import { takeSuggestion } from '../../actions/medication-select-actions';

const propTypes = {
  /**
   * A boolean to determine if the context of this component is under the Demo Card feature of the Sandbox, or in the actual
   * hook views that render cards themselves. This flag is necessary to make links and suggestions unactionable in the Card Demo view.
   */
  isDemoCard: PropTypes.bool,
  /**
   * Function callback to take a specific suggestion from a card
   */
  takeSuggestion: PropTypes.func.isRequired,
  /**
   * JSON response from a CDS service containing potential cards to display
   */
  cardResponses: PropTypes.object,
  onAppLaunch: PropTypes.func,
  launchLinks: PropTypes.object,
};

/**
 * Component that displays a list of cards (if any) on the UI, usually given some CDS service response of
 * JSON data.
 */
export class CardList extends Component {
  constructor(props) {
    super(props);
    this.launchLink = this.launchLink.bind(this);
    this.launchSource = this.launchSource.bind(this);
    this.renderSource = this.renderSource.bind(this);
  }

  /**
   * Take a suggestion from a CDS service based on action on from a card. Also pings the analytics endpoint (if any) of the
   * CDS service to notify that a suggestion was taken
   * @param {*} suggestion - CDS service-defined suggestion to take based on CDS Hooks specification
   * @param {*} url - CDS service endpoint URL
   */
  takeSuggestion(suggestion, url) {
    if (!this.props.isDemoCard) {
      if (suggestion.label) {
        if (suggestion.uuid) {
          axios({
            method: 'POST',
            url: `${url}/analytics/${suggestion.uuid}`,
            data: {},
          });
        }
        this.props.takeSuggestion(suggestion);
      } else {
        console.error('There was no label on this suggestion', suggestion);
      }
    }
  }

  /**
   * Prevent the source link from opening in the same tab
   * @param {*} e - Event emitted when source link is clicked
   */
  launchSource(e) {
    e.preventDefault();
  }

  /**
   * Remap a link if needed, to embed a SMART launch parameter
   * @param {*} link - Link object that contains the URL and any error state to catch
   */
  remapUrl(link) {
    const { type } = link;
    let { url, appContext } = link;
    appContext = appContext || 'default';

    const links = this.props.launchLinks;

    if (type === 'smart') {
      if (links[url] && links[url][appContext]) {
        url = links[url][appContext];
      } else {
        url = null;
      }
    }

    return url;
  }

  /**
   * Open the absolute or SMART link in a new tab and display an error if a SMART link does not have
   * appropriate launch context if used against a secured FHIR endpoint.
   * @param {*} e - Event emitted when link is clicked
   * @param {*} link - Link object that contains the URL and any error state to catch
   */
  launchLink(e, link) {
    if (!this.props.isDemoCard) {
      e.preventDefault();
      if (link.error) {
        // TODO: Create an error modal to display for SMART link that cannot be launched securely
        return null;
      }

      return window.open(this.remapUrl(link), '_blank');
    }

    return null;
  }

  /**
   * Helper function to build out the UI for the source of the Card
   * @param {*} source - Object as part of the card to build the UI for
   */
  renderSource(source) {
    if (!source.label) {
      return null;
    }
    let icon;
    if (source.icon) {
      icon = (
        <img
          className={styles['card-icon']}
          src={source.icon}
          alt="Could not fetch icon"
          width="100"
          height="100"
        />
      );
    }
    if (!this.props.isDemoCard) {
      return (
        <div className={styles['card-source']}>
          Source:{' '}
          <a
            className={styles['source-link']}
            href={source.url || '#'}
            onClick={e => this.launchSource(e)}
          >
            {' '}
            {source.label}{' '}
          </a>{' '}
          {icon}{' '}
        </div>
      );
    }
    return (
      <div className={styles['card-source']}>
        Source:
        <a // eslint-disable-line jsx-a11y/anchor-is-valid
          className={styles['source-link']}
          href="#"
          onClick={e => this.launchSource(e)}
        >
          {source.label}{' '}
        </a>{' '}
        {icon}{' '}
      </div>
    );
  }

  render() {
    const indicators = {
      info: 0,
      warning: 1,
      critical: 2,
      error: 3,
    };

    const summaryColors = {
      info: '#0079be',
      warning: '#ffae42',
      critical: '#c00',
      error: '#333',
    };
    const renderedCards = [];
    // Iterate over each card in the cards array
    this.props.cardResponses.cards
      .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
      .forEach((c, cardInd) => {
        const card = JSON.parse(JSON.stringify(c));

        // -- Summary --
        const summarySection = (
          <Text
            fontSize={18}
            weight={700}
            color={summaryColors[card.indicator]}
          >
            {' '}
            {card.summary}{' '}
          </Text>
        );

        // -- Source --
        const sourceSection =
          card.source && Object.keys(card.source).length
            ? this.renderSource(card.source)
            : '';

        // -- Detail (ReactMarkdown supports Github-flavored markdown) --
        const detailSection = card.detail ? (
          <ReactMarkdown
            escapeHtml={false}
            softBreak="br"
            source={card.detail}
          />
        ) : (
          ''
        );

        // -- Suggestions --
        let suggestionsSection;
        if (card.suggestions) {
          suggestionsSection = card.suggestions.map((item, ind) => (
            <Button
              key={ind}
              onClick={() => this.takeSuggestion(item, card.serviceUrl)}
              text={item.label}
              variant={Button.Opts.Variants.EMPHASIS}
            />
          ));
        }

        // -- Links --
        let linksSection;
        if (card.links) {
          linksSection = card.links.map((link, ind) => {
            const isSmart = link.type === 'smart';
            const remappedUrl = this.remapUrl(link);

            const unlaunchable = isSmart && !remappedUrl;
            const unlaunchableNotice = unlaunchable
              ? 'Cannot launch SMART link without a SMART-enabled FHIR server'
              : '';

            return (
              <div>
                <Button
                  isDisabled={unlaunchable}
                  title={unlaunchableNotice}
                  key={ind}
                  onClick={(e) => {
                  const launchedWindow = this.launchLink(e, link);
                  if (this.props.onAppLaunch) {
                    this.props.onAppLaunch(link, launchedWindow);
                  }
                }}
                  variant="action"
                  text={link.label}
                />
                <div className={styles.unlaunchable}>{unlaunchableNotice}</div>
              </div>
            );
          });
        }

        const classes = cx(
          styles['decision-card'],
          styles.alert,
          styles[`alert-${card.indicator}`],
        );

        const builtCard = (
          <TerraCard key={cardInd} className={classes}>
            {' '}
            {summarySection} {sourceSection} {detailSection}{' '}
            <div className={styles['suggestions-section']}>
              {' '}
              {suggestionsSection}{' '}
            </div>{' '}
            <div className={styles['links-section']}> {linksSection} </div>{' '}
          </TerraCard>
        );

        renderedCards.push(builtCard);
      });
    if (renderedCards.length === 0) {
      return <div> No Cards </div>;
    }
    return <div> {renderedCards} </div>;
  }
}

CardList.propTypes = propTypes;

const mapStateToProps = (state, ownProps) => ({
  ...ownProps,
  cardResponses: getCardsFromServices(
    state,
    Object.keys(getServicesByHook(
      state.hookState.currentHook,
      state.cdsServicesState.configuredServices,
    )),
  ),
  launchLinks: state.serviceExchangeState.launchLinks,
});

const mapDispatchToProps = dispatch => ({
  takeSuggestion: (suggestion) => {
    dispatch(takeSuggestion(suggestion));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CardList);
