import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';

describe('Card component', () => {
  console.error = jest.fn();
  let storeState;

  let Card;
  let shallowedComponent;
  let mockSpy;

  let smartLink;
  let hook;
  let patientId;
  let fhirBaseUrl;
  let accessToken;
  let cardResponses;

  let windowSpy;

  function setup(state) {
    jest.setMock('../../../src/retrieve-data-helpers/launch-context-retrieval', mockSpy);
    Card = require('../../../src/components/Card/card')['Card'];
    let component = <Card fhirServerUrl={fhirBaseUrl} 
                          fhirAccessToken={accessToken} 
                          patientId={patientId} 
                          cardResponses={cardResponses} />;
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
    mockSpy = jest.fn(() => {
      return Promise.resolve(`${fhirBaseUrl}/launch=123iss=456`);
    });
    cardResponses = {
      cards: [
        {
          links: [{ type: 'smart', url: smartLink }],
          suggestions: [{ label: 'sug-label' }],
          summary: 'Summary',
          indicator: 'warning',
          source: { label: 'Patient service', url: 'http://example-source.com', icon: 'http://icon.com' },
          detail: 'detail',
        },
        {
          indicator: 'info',
          summary: 'summary',
          source: { label: 'test-label' },
        }
      ],
    };
    setup(storeState);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('invokes a launch link sequence if a link is clicked', () => {
    expect(mockSpy).toHaveBeenCalled();
    shallowedComponent.find('.links-section').find('Button').simulate('click', { preventDefault() {} });
    expect(windowSpy).toHaveBeenCalled();
  });

  it('prevents default action if a event source link is clicked', () => {
    let eventWatch = jest.fn();
    shallowedComponent.find('.card-source').first().find('a').simulate('click', { preventDefault() { return eventWatch(); }});
    expect(eventWatch).toHaveBeenCalled();
  });

  it('adds fhirServiceUrl and patientId params to the smart link if launched openly', () => {
    shallowedComponent.setProps({
      fhirAccessToken: null
    });
    expect(mockSpy).toHaveBeenCalled();
    shallowedComponent.find('.links-section').find('Button').simulate('click', { preventDefault() {} });
    expect(windowSpy).toHaveBeenCalledWith(`${smartLink}?fhirServiceUrl=${fhirBaseUrl}&patientId=${patientId}`, '_blank');
    shallowedComponent.setProps({
      cardResponses: {
        cards: [{
          links: [{ type: 'smart', url: `${smartLink}?foo=boo` }],
        }]
      },
    });
    shallowedComponent.find('.links-section').find('Button').simulate('click', { preventDefault() {} });
    expect(windowSpy).toHaveBeenCalledWith(`${smartLink}?foo=boo&fhirServiceUrl=${fhirBaseUrl}&patientId=${patientId}`, '_blank');
  });

  it('does not launch a link if the link has an error', () => {
    shallowedComponent.setProps({
      cardResponses: {
        cards: [{
          links: [{ type: 'smart', url: `${smartLink}?foo=boo`, error: true }],
        }]
      },
    });
    shallowedComponent.find('.links-section').find('Button').simulate('click', { preventDefault() {} });
    expect(windowSpy).not.toHaveBeenCalled();
  });
});
