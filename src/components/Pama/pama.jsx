import cx from 'classnames';
import debounce from 'debounce-promise';
import lunr from 'lunr';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncSelect from 'react-select/async';

import IconTrash from 'terra-icon/lib/icon/IconTrash';
import Button from 'terra-button';

import CardList from '../CardList/card-list';
import PatientBanner from '../PatientBanner/patient-banner';
import styles from './pama.css';
import cdsExecution from '../../middleware/cds-execution';
import * as types from '../../actions/action-types';

import allProcedures from '../../assets/pama-procedure-codes.json';
import allReasons from '../../assets/pama-reason-codes.json';

const allProcedureCodings = allProcedures.expansion.contains;
const allReasonCodings = allReasons.expansion.contains;

const searchCodings = (codings) => {
  const idx = lunr(function buildIndex() {
    this.ref('code');
    this.field('search');
    this.field('code');
    codings
      .map((c) => ({
        ...c,
        search: c.display
          .replace(/\(.*?\)/, '')
          .replace(/Computed tomography/, 'Computed tomography CT')
          .replace(/Magnetic resonance/, 'Magnetic resonance MRI'),
      }))
      .forEach((c) => {
        this.add(c);
      });
  });

  const byCode = codings.reduce((acc, c) => { acc[c.code] = c; return acc; }, {});

  return (q) => idx.search(q).map((r) => ({
    ...byCode[r.ref],
  }));
};

const searchProcedure = searchCodings(allProcedureCodings);
const searchReason = searchCodings(allReasonCodings);

const actionToRating = (action) => {
  const resourceId = action.resource.id;
  return (action.resource.extension || [])
    .filter(
      ({ url }) => url === 'http://fhir.org/argonaut/Extension/pama-rating',
    )
    .flatMap(({ valueCodeableConcept }) => valueCodeableConcept.coding
      .map((c) => c.code)
      .map((rating) => ({ rating, resourceId })));
};

const dispatchRatingUpdates = (dispatch, updates) => updates
  .flatMap(actionToRating)
  .slice(0, 1)
  .forEach(({ rating, resourceId }) => dispatch({
    type: types.APPLY_PAMA_RATING,
    resourceId,
    rating,
  }));

const dispatchResourceUpdate = (dispatch, update) => {
  if (update.resource.code && update.resource.code.coding.length > 0) {
    dispatch({
      type: types.UPDATE_STUDY,
      coding: update.resource.code.coding[0],
    });
  }
  if (update.resource.reasonCode && update.resource.reasonCode.length > 0) {
    dispatch({
      type: types.ADD_REASON,
      coding: update.resource.reasonCode[0].coding[0],
    });
  }
};

const dispatchResourceSuggestedActions = (dispatch, suggestion) => suggestion.actions.forEach((a) => {
  if (a.type === 'create' || a.type === 'update') {
    dispatchResourceUpdate(dispatch, a);
  }
});

export const pamaTriggerHandler = {
  needExplicitTrigger: false,
  onSystemActions: (systemActions, state, dispatch) => {
    const updates = systemActions.filter(({ type }) => type === 'update');
    dispatchRatingUpdates(dispatch, updates);
  },
  onMessage: ({ data, dispatch, source }) => {
    const updates = [data]
      .filter(({ messageType }) => messageType === 'scratchpad.update')
      .map((m) => m.payload || {});
    dispatchRatingUpdates(dispatch, updates);

    updates.forEach((u) => {
      dispatchResourceUpdate(dispatch, u);
    });

    if ([data].filter(({ messageType }) => messageType === 'ui.done').length) {
      source.close();
    }
  },
  generateContext: (state) => ({
    selections: ['ServiceRequest/example-request-id'],
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
              coding: [state.pama.serviceRequest.studyCoding],
              text: state.pama.serviceRequest.studyCoding.display,
            },
            subject: {
              reference: `Patient/${state.patientState.currentPatient.id}`,
            },
            reasonCode: state.pama.serviceRequest.reasonCodings.map((r) => ({
              coding: [r],
              text: r.display,
            })),
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

const toSelectOption = (coding) => ({
  label: coding.display,
  value: coding.code,
  data: coding,
});

const onSearchCore = (query, haystack) => {
  const matches = haystack(query);
  return Promise.resolve(matches.slice(0, 50).map(toSelectOption));
};

const onSearch = debounce(onSearchCore, 200);

export class Pama extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resultLimit: 10,
    };
    this.studyInput = React.createRef();
    this.reasonInput = React.createRef();
  }

  render() {
    const { pamaRating } = this.props;
    const { studyCoding, reasonCodings } = this.props.serviceRequest;

    return (
      <div className={cx(styles.pama)}>
        <h1 className={styles['view-title']}>PAMA Imaging</h1>
        <PatientBanner />
        <AsyncSelect
          placeholder="Search orders"
          defaultOptions={allProcedureCodings
            .slice(0, this.state.resultLimit)
            .map(toSelectOption)}
          value=""
          onChange={(v) => this.props.updateStudy(v.data)}
          loadOptions={(q) => onSearch(q, searchProcedure)}
        />
        {studyCoding.display && (
          <div>
            <ul>
              {[studyCoding].map((r) => (
                <li>
                  <Button
                    text="Remove"
                    onClick={() => this.props.removeStudy(r)}
                    isIconOnly
                    icon={<IconTrash />}
                    variant="action"
                  />
                  <span className={styles['current-selection']}>
                    {r.display}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <br />
        <AsyncSelect
          placeholder="Search reasons"
          defaultOptions={allReasonCodings
            .slice(0, this.state.resultLimit)
            .map(toSelectOption)}
          value=""
          onChange={(v) => this.props.addReason(v.data)}
          loadOptions={(q) => onSearch(q, searchReason)}
        />
        {reasonCodings.length > 0 && (
          <div>
            <ul>
              {reasonCodings.map((r) => (
                <li>
                  <Button
                    text="Remove"
                    onClick={() => this.props.removeReason(r)}
                    isIconOnly
                    icon={<IconTrash />}
                    variant="action"
                  />
                  <span className={styles['current-selection']}>
                    {r.display}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles['rating-box']}>
          PAMA Rating:
          {' '}
          {pamaRating}
          {{ appropriate: '✓', 'not-appropriate': '⚠' }[pamaRating] || ''}
        </div>

        <br />
        <CardList
          takeSuggestion={this.props.takeSuggestion}
          onAppLaunch={this.props.launchApp}
        />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  launchApp(link, sourceWindow) {
    dispatch({
      type: types.LAUNCH_SMART_APP,
      triggerPoint: 'pama/order-select',
      link,
      sourceWindow,
    });
  },
  addReason(reason) {
    dispatch({ type: types.ADD_REASON, coding: reason });
  },
  removeReason(reason) {
    dispatch({ type: types.REMOVE_REASON, coding: reason });
  },
  removeStudy(study) {
    dispatch({ type: types.REMOVE_STUDY, coding: study });
  },
  updateStudy(study) {
    dispatch({ type: types.UPDATE_STUDY, coding: study });
  },
  signOrder() {
    dispatch({ type: types.TRIGGER_ORDER_SIGN });
  },
  takeSuggestion(suggestion) {
    dispatchResourceSuggestedActions(dispatch, suggestion);
  },
});

const mapStateToProps = (store) => ({
  serviceRequest: store.pama.serviceRequest,
  pamaRating: store.pama.pamaRating,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Pama);
