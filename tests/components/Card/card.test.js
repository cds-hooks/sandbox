import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import MockAdapter from 'axios-mock-adapter';

describe('Card component', () => {
  console.error = jest.fn();
  let storeState;
  let mockAxios;
  let axios;

  let CardList;
  let shallowedComponent;
  let mockSpy;

  let smartLink;
  let hook;
  let patientId;
  let fhirBaseUrl;
  let accessToken;
  let cardResponses;
  let takeSuggestion;
  let suggestion;
  let invalidSuggestion;
  let serviceUrl;

  let windowSpy;

  function setup(state) {
    jest.setMock('../../../src/retrieve-data-helpers/launch-context-retrieval', mockSpy);
    CardList = require('../../../src/components/CardList/card-list')['CardList'];
    let component = <CardList fhirServerUrl={fhirBaseUrl} 
                              fhirAccessToken={accessToken} 
                              patientId={patientId} 
                              smartLaunchSupported={true}
                              cardResponses={cardResponses}
                              launchLinks={{
                                "http://example-smart.com/launch": {
                                  "default": "http://remapped-link"
                                }
                              }}
                              takeSuggestion={takeSuggestion} />;
    shallowedComponent = shallow(component);
  }

  beforeEach(() => {
    windowSpy = jest.fn();
    window.open = windowSpy;
    fhirBaseUrl = 'http://example-fhir-server.com';
    accessToken = { access_token: 'token-123' };
    patientId = 'patient-id';
    hook = 'patient-view';
    smartLink = 'http://example-smart.com/launch';
    serviceUrl = 'http://service.com/id-1';
    axios = require('axios').default;
    mockAxios = new MockAdapter(axios);
    mockSpy = jest.fn(() => {
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
    setup(storeState);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('invokes a launch link sequence if a link is clicked', () => {
    shallowedComponent.find('.links-section').find('ForwardRef(Button)').simulate('click', { preventDefault() {} });
    expect(windowSpy).toHaveBeenCalled();
  });

  it('prevents default action if a event source link is clicked', () => {
    let eventWatch = jest.fn();
    shallowedComponent.find('.card-source').first().find('a').simulate('click', { preventDefault() { return eventWatch(); }});
    expect(eventWatch).toHaveBeenCalled();
  });

  it('does not launch a link if the link has an error', () => {
    shallowedComponent.setProps({
      cardResponses: {
        cards: [{
          links: [{ type: 'smart', url: `${smartLink}?foo=boo`, error: true }],
        }]
      },
    });
    shallowedComponent.find('.links-section').find('ForwardRef(Button)').simulate('click', { preventDefault() {} });
    expect(windowSpy).not.toHaveBeenCalled();
  });

  it('takes a suggestion if there is a label', () => {
    shallowedComponent.find('.suggestions-section').find('ForwardRef(Button)').at(0).simulate('click', { preventDefault() {} });
    mockAxios.onPost(`${serviceUrl}/feedback`).reply(200);
    expect(takeSuggestion).toHaveBeenCalledWith(suggestion);
  });

  it('does not take a suggestion if it is does not have a label', () => {
    shallowedComponent.find('.suggestions-section').find('ForwardRef(Button)').at(1).simulate('click', { preventDefault() {} });
    expect(takeSuggestion).not.toHaveBeenCalled();
  });
});
