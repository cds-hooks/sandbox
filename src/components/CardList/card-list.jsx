/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import cx from 'classnames';
import axios from 'axios';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import generateJWT from '../../retrieve-data-helpers/jwt-generator';

import styles from './card-list.css';
import {
  getServicesByHook,
  getCardsFromServices,
} from '../../reducers/helpers/services-filter';

import store from '../../store/store';
import { dismissCard } from '../../actions/service-exchange-actions';

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
  /**
   * Function callback when an app is launched via a SMART link.
   */
  onAppLaunch: PropTypes.func,
  /**
   * JSON structure allowing mapping Card links to URLs with SMART launch contexts.
   */
  launchLinks: PropTypes.object,
};

/**
 * Component that displays a list of cards (if any) on the UI, usually given some CDS service response of
 * JSON data.
 */
export class CardList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dismissMenuAnchor: null,
      currentCardId: null,
    };
    this.launchLink = this.launchLink.bind(this);
    this.launchSource = this.launchSource.bind(this);
    this.renderSource = this.renderSource.bind(this);
    this.handleDismissMenuOpen = this.handleDismissMenuOpen.bind(this);
    this.handleDismissMenuClose = this.handleDismissMenuClose.bind(this);
  }

  handleDismissMenuOpen(event, cardId) {
    this.setState({ dismissMenuAnchor: event.currentTarget, currentCardId: cardId });
  }

  handleDismissMenuClose() {
    this.setState({ dismissMenuAnchor: null, currentCardId: null });
  }

  /**
   * Take a suggestion from a CDS service based on action on from a card. Also pings the feedback
   * endpoint of the CDS service to notify that a suggestion was taken.
   * @param {*} suggestion - CDS service-defined suggestion to take based on CDS Hooks specification
   * @param {*} cardUUID - UUID of the card containing the suggestion
   * @param {*} serviceUrl - CDS service endpoint URL
   */
  takeSuggestion(suggestion, cardUUID, serviceUrl) {
    if (!this.props.isDemoCard) {
      if (suggestion.label) {
        if (suggestion.uuid && cardUUID) {
          const cardFeedback = {
            card: cardUUID,
            outcome: 'accepted',
            acceptedSuggestions: [
              {
                id: suggestion.uuid,
              },
            ],
            outcomeTimestamp: new Date().toISOString(),
          };

          this.sendFeedback(serviceUrl, cardFeedback);
        }

        this.props.takeSuggestion(suggestion);
      } else {
        console.error('There was no label on this suggestion', suggestion);
      }
    }
  }

  dismissCard(serviceUrl, cardUUID, reason) {
    if (this.props.isDemoCard) {
      return;
    }

    const cardFeedback = {
      card: cardUUID,
      outcome: 'overridden',
      outcomeTimestamp: new Date().toISOString(),
    };

    if (reason && reason.code) {
      cardFeedback.overrideReason = {
        reason: {
          code: reason.code,
        },
      };

      if (reason.system) {
        cardFeedback.overrideReason.reason.system = reason.system;
      }
    }

    this.sendFeedback(serviceUrl, cardFeedback);

    store.dispatch(dismissCard({ serviceUrl, cardUUID }));
  }

  sendFeedback(serviceUrl, cardFeedback) {
    const feedbackEndpoint = `${serviceUrl}/feedback`;
    const signedPrivateJWT = generateJWT(feedbackEndpoint);

    axios({
      method: 'POST',
      url: feedbackEndpoint,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signedPrivateJWT}`,
      },
      data: {
        feedback: [
          cardFeedback,
        ],
      },
    });
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
      if (links && links[url] && links[url][appContext]) {
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
          Source:
          {' '}
          <a
            className={styles['source-link']}
            href={source.url || '#'}
            onClick={(e) => this.launchSource(e)}
          >
            {' '}
            {source.label}
            {' '}
          </a>
          {' '}
          {icon}
          {' '}
        </div>
      );
    }
    return (
      <div className={styles['card-source']}>
        Source:
        <a // eslint-disable-line jsx-a11y/anchor-is-valid
          className={styles['source-link']}
          href="#"
          onClick={(e) => this.launchSource(e)}
        >
          {source.label}
          {' '}
        </a>
        {' '}
        {icon}
        {' '}
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
          <Typography
            fontSize={18}
            fontWeight={700}
            color={summaryColors[card.indicator]}
          >
            {' '}
            {card.summary}
            {' '}
          </Typography>
        );

        // -- Source --
        const sourceSection = card.source && Object.keys(card.source).length
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
            <MuiButton
              key={ind}
              onClick={() => this.takeSuggestion(item, card.uuid, card.serviceUrl)}
              variant="contained"
            >
              {item.label}
            </MuiButton>
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
              <div key={ind}>
                <MuiButton
                  disabled={unlaunchable}
                  title={unlaunchableNotice}
                  onClick={(e) => {
                    const launchedWindow = this.launchLink(e, link);
                    if (this.props.onAppLaunch) {
                      this.props.onAppLaunch(link, launchedWindow);
                    }
                  }}
                  variant="text"
                >
                  {link.label}
                </MuiButton>
                <div className={styles.unlaunchable}>{unlaunchableNotice}</div>
              </div>
            );
          });
        }

        let dismissSection;
        if (card.uuid) {
          const { overrideReasons } = card;
          if (overrideReasons) {
            const menuId = `dismiss-menu-${card.uuid}`;
            const isMenuOpen = this.state.currentCardId === card.uuid && Boolean(this.state.dismissMenuAnchor);

            dismissSection = (
              <div key="dismiss">
                <hr />
                <ButtonGroup variant="outlined">
                  <MuiButton
                    onClick={() => {
                      this.dismissCard(card.serviceUrl, card.uuid);
                    }}
                  >
                    Dismiss
                  </MuiButton>
                  <MuiButton
                    size="small"
                    aria-controls={isMenuOpen ? menuId : undefined}
                    aria-expanded={isMenuOpen ? 'true' : undefined}
                    aria-label="select dismiss reason"
                    aria-haspopup="menu"
                    onClick={(e) => this.handleDismissMenuOpen(e, card.uuid)}
                  >
                    <ArrowDropDownIcon />
                  </MuiButton>
                </ButtonGroup>
                <Menu
                  id={menuId}
                  anchorEl={isMenuOpen ? this.state.dismissMenuAnchor : null}
                  open={isMenuOpen}
                  onClose={this.handleDismissMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'split-button',
                  }}
                >
                  {overrideReasons.map((reason, idx) => (
                    <MenuItem
                      key={idx}
                      onClick={() => {
                        this.dismissCard(card.serviceUrl, card.uuid, reason);
                        this.handleDismissMenuClose();
                      }}
                    >
                      Override:
                      {' '}
                      {reason.display}
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            );
          } else {
            dismissSection = (
              <div key="dismiss">
                <hr />
                <MuiButton
                  title="Dismiss Card"
                  onClick={() => {
                    this.dismissCard(card.serviceUrl, card.uuid);
                  }}
                  variant="outlined"
                >
                  Dismiss
                </MuiButton>
              </div>
            );
          }
        }

        const classes = cx(
          styles['decision-card'],
          styles.alert,
          styles[`alert-${card.indicator}`],
        );

        const builtCard = (
          <Card key={cardInd} className={classes}>
            <CardContent>
              {summarySection}
              {sourceSection}
              {detailSection}
              <div className={styles['suggestions-section']}>
                {suggestionsSection}
              </div>
              <div className={styles['links-section']}>
                {linksSection}
              </div>
              <div className={styles['dismiss-section']}>
                {dismissSection}
              </div>
            </CardContent>
          </Card>
        );

        renderedCards.push(builtCard);
      });
    if (renderedCards.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <CheckCircleOutlineIcon
            sx={{
              fontSize: 64,
              color: '#9e9e9e',
              marginBottom: 2,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 500,
              marginBottom: 1,
            }}
          >
            No recommendations to display
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#999',
              maxWidth: 400,
            }}
          >
            All clear! No clinical decision support cards are available for this context.
          </Typography>
        </Box>
      );
    }
    return (
      <div>
        {' '}
        {renderedCards}
        {' '}
      </div>
    );
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

export default connect(
  mapStateToProps,
)(CardList);
