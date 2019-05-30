import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/hook-actions';

describe('Hook Actions', () => {
  it('creates action to set a current hook for the application', () => {
    const hook = 'order-select';
    const expectedAction = {
      type: types.SET_HOOK,
      hook,
    };

    expect(actions.setHook(hook)).toEqual(expectedAction);
  });
});
