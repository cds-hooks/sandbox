import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/card-demo-actions';

describe('Card Demo Actions', () => {
  it('creates action to store current user JSON for the card demo', () => {
    const userJson = JSON.stringify({"test":"foo"});
    const expectedAction = {
      type: types.STORE_USER_CARD_JSON,
      userJson,
    };

    expect(actions.storeCardDemoJson(userJson)).toEqual(expectedAction);
  });

  it('creates action to toggle the demo view and EHR view', () => {
    const expectedAction = {
      type: types.TOGGLE_DEMO_VIEW,
    };
    expect(actions.toggleDemoView()).toEqual(expectedAction);
  });
});
