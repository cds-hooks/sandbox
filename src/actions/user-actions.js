import * as types from './action-types';

/**
 * Set the user in context of the application
 * @param newUserId - id in the format resourceType/id (Practitioner/1234)
 */
export default function switchUser(newUserId) {
  return {
    type: types.SWITCH_USER,
    userId: newUserId,
  };
}
