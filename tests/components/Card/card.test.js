import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MockAdapter from 'axios-mock-adapter';

const theme = createTheme();

let mockLaunchContextFn = jest.fn();

jest.mock('../../../src/retrieve-data-helpers/launch-context-retrieval', () => {
  return (...args) => mockLaunchContextFn(...args);
});

import { CardList } from '../../../src/components/CardList/card-list';

describe('Card component', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  let mockAxios;
  let axios;
  let smartLink;
  let patientId;
  let fhirBaseUrl;
  let accessToken;
  let cardResponses;
  let takeSuggestion;
  let suggestion;
  let invalidSuggestion;
  let serviceUrl;
  let windowSpy;

  function renderCardList(props = {}) {
    const defaultProps = {
      fhirServerUrl: fhirBaseUrl,
      fhirAccessToken: accessToken,
      patientId: patientId,
      smartLaunchSupported: true,
      cardResponses: cardResponses,
      launchLinks: {
        "http://example-smart.com/launch": {
          "default": "http://remapped-link"
        }
      },
      takeSuggestion: takeSuggestion,
    };
    return render(
      <ThemeProvider theme={theme}>
        <CardList {...defaultProps} {...props} />
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    windowSpy = jest.fn();
    window.open = windowSpy;
    fhirBaseUrl = 'http://example-fhir-server.com';
    accessToken = { access_token: 'token-123' };
    patientId = 'patient-id';
    smartLink = 'http://example-smart.com/launch';
    serviceUrl = 'http://service.com/id-1';
    axios = require('axios').default;
    mockAxios = new MockAdapter(axios);
    mockLaunchContextFn = jest.fn(() => {
      return Promise.resolve(`${fhirBaseUrl}/launch=123iss=456`);
    });
    takeSuggestion = jest.fn();
    suggestion = {
      label: 'sug-label',
      uuid: 'uuid-example',
      resource: {
        foo: 'foo',
      },
    };
    invalidSuggestion = { foo: 'foo' };
    cardResponses = {
      cards: [
        {
          links: [{ type: 'smart', url: smartLink }],
          suggestions: [suggestion, invalidSuggestion],
          summary: 'Summary',
          indicator: 'warning',
          source: { label: 'Patient service', url: 'http://example-source.com', icon: 'http://icon.com' },
          detail: 'detail',
          serviceUrl,
        },
        {
          indicator: 'info',
          summary: 'summary',
          source: { label: 'test-label' },
          serviceUrl,
        }
      ],
    };
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('invokes a launch link sequence if a link is clicked', () => {
    const { container } = renderCardList();
    const linkButton = container.querySelector('.links-section button');
    fireEvent.click(linkButton);
    expect(windowSpy).toHaveBeenCalled();
  });

  it('prevents default action if a event source link is clicked', () => {
    const { container } = renderCardList();
    const sourceLink = container.querySelector('.card-source a');
    const eventWatch = jest.fn();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'preventDefault', { value: eventWatch });
    sourceLink.dispatchEvent(event);
    expect(eventWatch).toHaveBeenCalled();
  });

  it('does not launch a link if the link has an error', () => {
    const { container } = renderCardList({
      cardResponses: {
        cards: [{
          links: [{ type: 'smart', url: `${smartLink}?foo=boo`, error: true }],
          summary: 'Error card',
          indicator: 'warning',
          source: { label: 'test' },
          serviceUrl,
        }]
      }
    });
    const linkButton = container.querySelector('.links-section button');
    fireEvent.click(linkButton);
    expect(windowSpy).not.toHaveBeenCalled();
  });

  it('takes a suggestion if there is a label', () => {
    const { container } = renderCardList();
    const suggestionButtons = container.querySelectorAll('.suggestions-section button');
    fireEvent.click(suggestionButtons[0]);
    mockAxios.onPost(`${serviceUrl}/feedback`).reply(200);
    expect(takeSuggestion).toHaveBeenCalledWith(suggestion);
  });

  it('does not take a suggestion if it is does not have a label', () => {
    const { container } = renderCardList();
    const suggestionButtons = container.querySelectorAll('.suggestions-section button');
    fireEvent.click(suggestionButtons[1]);
    expect(takeSuggestion).not.toHaveBeenCalled();
  });
});
