/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import Select from 'terra-form-select';
import Button from 'terra-button';

import CardList from '../CardList/card-list';
import cdsExecution from '../../middleware/cds-execution';

const actionToRating = (action) => {
  const resourceId = action.resource.id;
  return (action.resource.extension || [])
    .filter(({ url }) => url === 'http://fhir.org/argonaut/Extension/pama-rating')
    .flatMap(({ valueCodeableConcept }) =>
      valueCodeableConcept.coding
        .map(c => c.code)
        .map(rating => ({ rating, resourceId })));
};

const pamaTriggerHandler = {
  needExplicitTrigger: false,
  onSystemActions: (systemActions, state, dispatch) => {
    systemActions
      .filter(({ type }) => type === 'update')
      .flatMap(actionToRating)
      .slice(0, 1)
      .forEach(({ rating, resourceId }) =>
        dispatch({
          type: 'APPLY_PAMA_RATING',
          resourceId,
          rating,
        }));
  },
  onMessage: ({ data, dispatch }) => {
    console.log('Pama screen received in trigger handler', data);
    dispatch({
      type: 'APPLY_PAMA_RATING',
      resourceId: 'fake',
      rating: 'appropriate',
    });
  },
  generateContext: state => ({
    draftOrders: {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'ServiceRequest',
            id: 'example-request-id',
            status: 'draft',
            intent: 'plan',
            code: {
              coding: [
                {
                  system: 'http://www.ama-assn.org/go/cpt',
                  code: state.pama.serviceRequest.code,
                },
              ],
              text: 'Lumbar spine CT',
            },
            subject: {
              reference: `Patient/${state.patientState.currentPatient.id}`,
            },
            reasonCode: [
              {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: state.pama.serviceRequest.reasonCode,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  }),
};

cdsExecution.registerTriggerHandler('pama/order-select', pamaTriggerHandler);

cdsExecution.registerTriggerHandler('pama/order-sign', {
  ...pamaTriggerHandler,
  needExplicitTrigger: 'TRIGGER_ORDER_SIGN',
});

const studyCodes = [
  {
    display: 'Lumbar spine CT',
    code: '72133',
  },
  {
    display: 'Cardiac MRI',
    code: '75561',
  },
];

const reasonCodes = [
  {
    display: 'Low back pain',
    code: '279039007',
  },
  {
    display: 'Congenital heart disease',
    code: '13213009',
  },
];

export class OrderImaging extends Component {
  updateField(field) {
    return (e, v) => this.props.updateServiceRequest(field, v);
  }

  render() {
    const { pamaRating } = this.props;
    const { code, reasonCode } = this.props.serviceRequest;

    return (
      <div>
        <Select
          name="study-select"
          value={code}
          onChange={this.updateField('code')}
        >
          {studyCodes.map(coding => (
            <Select.Option key={coding.code} value={coding.code} display={coding.display} />
          ))}
        </Select>
        <Select
          name="reason-select"
          value={reasonCode}
          onChange={this.updateField('reasonCode')}
        >
          {reasonCodes.map(coding => (
            <Select.Option key={coding.code} value={coding.code} display={coding.display} />
          ))}
        </Select>

        <span>
          PAMA Rating: {pamaRating}
          {{ appropriate: '✓', 'not-appropriate': '⚠' }[pamaRating] || '?'}
        </span>
        <br />
        <Button text="Sign Order" onClick={this.props.signOrder} />
        <CardList onAppLaunch={this.props.launchApp} />
      </div>
    );
  }
}

// TODO define types formally
const mapDispatchToProps = dispatch => ({
  launchApp(link, sourceWindow) {
    console.log('Launched', link, sourceWindow);
    dispatch({
      type: 'LAUNCH_SMART_APP',
      triggerPoint: 'pama/order-select',
      link,
      sourceWindow,
    });
  },
  updateServiceRequest(field, val) {
    dispatch({ type: 'UPDATE_SERVICE_REQUEST', field, val });
  },
  signOrder() {
    dispatch({ type: 'TRIGGER_ORDER_SIGN' });
  },
});

const mapStateToProps = store => ({
  serviceRequest: store.pama.serviceRequest,
  pamaRating: store.pama.pamaRating,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OrderImaging);
