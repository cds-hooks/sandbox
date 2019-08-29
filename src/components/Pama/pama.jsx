import cx from "classnames";
import debounce from "debounce";
import lunr from "lunr";
import React, { Component } from "react";
import { connect } from "react-redux";

import IconAdd from "terra-icon/lib/icon/IconAdd";
import Select from "terra-form-select";
import Button from "terra-button";

import CardList from "../CardList/card-list";
import PatientBanner from "../PatientBanner/patient-banner";
import styles from "./pama.css";
import cdsExecution from "../../middleware/cds-execution";
import * as types from "../../actions/action-types";

import procedures from "../../assets/pama-procedure-codes.json";
import reasons from "../../assets/pama-reason-codes.json";

const searchCodings = codings => {
  const idx = lunr(function() {
    this.ref("code");
    this.field("search");
    this.field("code");
    codings
      .map(c => ({
        ...c,
        search: c.display
          .replace(/\(.*?\)/, "")
          .replace(/Computed tomography/, "Computed tomography CT")
          .replace(/Magnetic resonance/, "Magnetic resonance MRI")
      }))
      .forEach(c => {
        this.add(c);
      });
  });

  const byCode = Object.fromEntries(codings.map(c => [c.code, c]));

  return q =>
    idx.search(q).map(r => ({
      ...r,
      ...byCode[r.ref]
    }));
};

const searchProcedure = searchCodings(procedures.expansion.contains);
const searchReason = searchCodings(reasons.expansion.contains);

const actionToRating = action => {
  const resourceId = action.resource.id;
  return (action.resource.extension || [])
    .filter(
      ({ url }) => url === "http://fhir.org/argonaut/Extension/pama-rating"
    )
    .flatMap(({ valueCodeableConcept }) =>
      valueCodeableConcept.coding
        .map(c => c.code)
        .map(rating => ({ rating, resourceId }))
    );
};

const dispatchUpdates = (dispatch, updates) =>
  updates
    .flatMap(actionToRating)
    .slice(0, 1)
    .forEach(({ rating, resourceId }) =>
      dispatch({
        type: types.APPLY_PAMA_RATING,
        resourceId,
        rating
      })
    );

export const pamaTriggerHandler = {
  needExplicitTrigger: false,
  onSystemActions: (systemActions, state, dispatch) => {
    const updates = systemActions.filter(({ type }) => type === "update");
    dispatchUpdates(dispatch, updates);
  },
  onMessage: ({ data, dispatch }) => {
    const updates = [data]
      .filter(({ messageType }) => messageType === "scratchpad.update")
      .map(m => m.payload || {});

    dispatchUpdates(dispatch, updates);
  },
  generateContext: state => ({
    selections: ["ServiceRequest/example-request-id"],
    draftOrders: {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "ServiceRequest",
            id: "example-request-id",
            status: "draft",
            intent: "plan",
            code: {
              coding: [
                {
                  system: "http://www.ama-assn.org/go/cpt",
                  code: state.pama.serviceRequest.code
                }
              ]
            },
            subject: {
              reference: `Patient/${state.patientState.currentPatient.id}`
            },
            reasonCode: [
              {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    code: state.pama.serviceRequest.reasonCode
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  })
};

cdsExecution.registerTriggerHandler("pama/order-select", pamaTriggerHandler);

cdsExecution.registerTriggerHandler("pama/order-sign", {
  ...pamaTriggerHandler,
  needExplicitTrigger: "TRIGGER_ORDER_SIGN"
});

const defaultStudyCodes = [
  {
    display: "Lumbar spine CT",
    code: "72133"
  },
  {
    display: "Cardiac MRI",
    code: "75561"
  }
];

const defaultReasonCodes = [
  {
    display: "Low back pain",
    code: "279039007"
  },
  {
    display: "Congenital heart disease",
    code: "13213009"
  }
];

const onSearchCore = (query, haystack, onResults) => {
  console.log("Queried", query);
  const matches = haystack(query);
  onResults(matches.slice(0, 50));
};

const onSearch = debounce(onSearchCore, 200);

export class Pama extends Component {
  constructor(props) {
    super(props);
    this.state = {
      studyCodes: [],
      reasonCodes: [],
      resultLimit: 10
    };
    this.studyInput = React.createRef();
    this.reasonInput = React.createRef();
  }

  updateField(field) {
    return (e, v) => this.props.updateServiceRequest(field, v);
  }

  render() {
    const { pamaRating } = this.props;
    const { code, reasonCode } = this.props.serviceRequest;
    const { studyCodes, reasonCodes } = this.state;
    const handleSearch = (searchFn, stateKey) => e =>
      onSearch(e.target.value, searchFn, matches =>
        this.setState({
          [stateKey]: matches
        })
      );

    const addStudy = coding => {
      this.props.updateServiceRequest('code', coding.code)
      this.state.studyCodes = []
    }

    const addReason = coding => {
      this.props.updateServiceRequest('reasonCode', coding.code)
      this.state.reasonCodes = []
    }


    return (
      <div className={cx(styles.pama)}>
        <h1 className={styles["view-title"]}>PAMA Imaging</h1>
        <PatientBanner />
        <div>
          <input
            ref={this.studyInput}
            placeholder="Search orders"
            onChange={handleSearch(searchProcedure, "studyCodes")}
            onFocus={handleSearch(searchProcedure, "studyCodes")}
          />
          {this.state.studyCodes
            .slice(0, this.state.resultLimit)
            .map(coding => (
              <div className={styles["choice"]} key={coding.code}>
                <Button onClick={e => addStudy(coding)} text="Add" icon={<IconAdd />} variant="action" />
                {coding.display} ({coding.code})
              </div>
            ))}
        </div>
        <div>
        <input
          ref={this.reasonInput}
          placeholder="Search reasons"
          onChange={handleSearch(searchReason, "reasonCodes")}
          onFocus={handleSearch(searchReason, "reasonCodes")}
        />
        {this.state.reasonCodes.slice(0, this.state.resultLimit).map(coding => (
            <div className="choice" key={coding.code}>
            <Button onClick={e => addReason(coding)} text="Add" icon={<IconAdd />} variant="action" />
            {coding.display} ({coding.code})
          </div>
        ))}
        </div>

        <span>
          PAMA Rating: {pamaRating}
          {{ appropriate: "✓", "not-appropriate": "⚠" }[pamaRating] || "?"}
        </span>
        <br />
        <CardList onAppLaunch={this.props.launchApp} />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  launchApp(link, sourceWindow) {
    dispatch({
      type: types.LAUNCH_SMART_APP,
      triggerPoint: "pama/order-select",
      link,
      sourceWindow
    });
  },
  updateServiceRequest(field, val) {
    dispatch({ type: types.UPDATE_SERVICE_REQUEST, field, val });
  },
  signOrder() {
    dispatch({ type: types.TRIGGER_ORDER_SIGN });
  }
});

const mapStateToProps = store => ({
  serviceRequest: store.pama.serviceRequest,
  pamaRating: store.pama.pamaRating
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Pama);
