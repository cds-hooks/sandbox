import React, { Component } from 'react';
import { connect } from 'react-redux';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/javascript/javascript';
// import 'codemirror/lib/codemirror.css';
// import 'codemirror/addon/lint/lint.css';

import Button from 'terra-button';
import Text from 'terra-text';
import ErrorView from 'terra-clinical-error-view';

import { storeCardDemoJson } from '../../actions/card-demo-actions';
import styles from './card-demo.css';
import { CardList } from '../CardList/card-list';

export class CardDemo extends Component {
  constructor(props) {
    super(props);
    let displayJSONError = false;
    let errorText = '';
    try {
      JSON.parse(props.tempUserJson);
    } catch (e) {
      displayJSONError = true;
      errorText = 'Cannot parse the JSON';
    }
    this.state = {
      displayJSONError,
      errorText,
    };

    this.getExampleCard = this.getExampleCard.bind(this);
    this.updateCard = this.updateCard.bind(this);
    this.resetExample = this.resetExample.bind(this);
  }

  componentDidMount() {
    const exampleCard = JSON.stringify(this.getExampleCard(), null, 2);
    if (!this.props.tempUserJson) {
      this.updateCard(exampleCard);
    }
  }

  getExampleCard() {
    return {
      summary: 'Example Card',
      indicator: 'info',
      detail: 'Add an XYZ complimentary medication OR switch patient order to ABC. '
                + 'See SMART app for more details.',
      source: {
        label: 'Medicine Library',
        url: 'https://example.com',
      },
      links: [
        {
          label: 'Medication SMART app',
          url: 'https://example.com/launch',
          type: 'smart',
        },
      ],
      suggestions: [
        {
          label: 'Add Complimentary',
          uuid: '123',
          actions: [
            {
              type: 'create',
              description: 'Add XYZ',
              resource: {},
            },
            {
              type: 'delete',
              description: 'Cancel ABC',
              resource: 'MedicationRequest/ABC',
            },
          ],
        },
        {
          label: 'Change Order',
          uuid: '456',
          actions: [
            {
              type: 'modify',
              description: 'Modify dosage of Medication',
              resource: 'MedicationRequest/ABC',
            },
          ],
        },
      ],
    };
  }

  updateCard(newJSON) {
    try {
      const parsedJSON = JSON.parse(newJSON);
      if (parsedJSON && typeof parsedJSON === 'object') {
        if (this.state.displayJSONError) {
          this.setState({
            displayJSONError: false,
            errorText: '',
          });
        }

        this.props.storeTempCardResponse(newJSON);
      }
    } catch (e) {
      if (!this.state.displayJSONError) {
        this.setState({
          displayJSONError: true,
          errorText: 'Check your JSON syntax',
        });
      }
    }
  }

  resetExample() {
    const exampleCode = JSON.stringify(this.getExampleCard(), null, 2);
    this.updateCard(exampleCode);
    this.cm.codeMirror.setValue(exampleCode);
  }

  render() {
    const options = {
      lineNumbers: true,
      mode: {
        name: 'javascript',
        json: true,
      },
      lint: true,
      tabSize: 2,
    };

    const exampleCode = JSON.stringify(this.getExampleCard(), null, 2);
    const errorPanel = <ErrorView description={this.state.errorText} />;
    const constructedCardFormat = {
      cards: [
        (JSON.parse(this.props.tempUserJson) || this.getExampleCard()),
      ],
    };

    const cardDisplay = (!this.state.displayJSONError && this.props.tempUserJson)
      ? (
        <CardList
          isDemoCard
          takeSuggestion={() => { console.log('Take suggestion'); }}
          cardResponses={constructedCardFormat}
        />
      ) : null;

    return (
      <div className={styles['app-main']}>
        <div className={styles['card-render-view-container']}>
          <Text weight={700} fontSize={20}>Card Demo</Text>
          <div className={styles['card-render-space']}>
            {cardDisplay}
            <div className={styles['error-space']}>
              {this.state.displayJSONError ? errorPanel : ''}
            </div>
          </div>
        </div>
        <div className={styles['card-render-json-container']}>
          <div className={styles['full-width']}>
            <div className={styles['card-render-json-title']}>
              <Text weight={400} fontSize={16}>Preview a Card with JSON</Text>
            </div>
            <div className={styles['card-render-json-reset']}>
              <Button
                variant={Button.Opts.Variants['DE-EMPHASIS']}
                text="Reset Example"
                onClick={this.resetExample}
              />
            </div>
          </div>
          <div className={styles['card-render-json-border']}>
            <CodeMirror
              value={this.props.tempUserJson || exampleCode}
              ref={(el) => { this.cm = el; }}
              onChange={this.updateCard}
              style={{ 'font-family': 'Inconsolata, Menlo, Consolas, monospace !important' }}
              options={options}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (store) => ({
  tempUserJson: store.cardDemoState.tempUserJson,
});

const mapDispatchToProps = (dispatch) => ({
  storeTempCardResponse: (card) => {
    dispatch(storeCardDemoJson(card));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CardDemo);
