import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/ui-actions';

describe('UI Actions', () => {
  it('creates action to set the loading status for the application', () => {
    const status = true;
    const expectedAction = {
      type: types.SET_LOADING_STATUS,
      isLoaderOn: status,
    };

    expect(actions.setLoadingStatus(status)).toEqual(expectedAction);
  });

  it('creates action to set the context view visiblity for the application', () => {
    const expectedAction = {
      type: types.SET_CONTEXT_VISIBILITY,
    };

    expect(actions.setContextVisibility()).toEqual(expectedAction);
  });
});