/*
 *
 *  Redux Middleware Sample
 *  Copyright 2016 Instamojo R&D. All rights reserved.
 *  Author: Aakash Goel <aakash@instamojo.com>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

/* This code sample demonstrates using Redux Middleware to handle GET requests
 * Sample Usage via an action:
 *      export function handleFetchPayouts () {
 *        return {
 *          [CALL_API]: {
 *            endpoint: [String or Function],
 *            requestTypeActionProps: [Object],
 *            onSuccess: [Function],
 *            onFailure: [Function]
 *          }
 *        }
 *      }
 */

import {
  HANDLE_DISABLE_ACTIONABLES,
  HANDLE_ENABLE_ACTIONABLES,
  MARK_PAGE_NOT_FOUND,
  MARK_USER_LOGGED_OUT
} from '../actions/GlobalActions';

import { camelCaseKeys } from '../config/utils';

function callApi(endpoint) {
  return fetch(endpoint, {
    'credentials': 'same-origin'
  })
  .then(response =>
    response.json().then(json => ({ json, response }))
  ).then(({ json, response }) => {
    json.isServerOK = !!response.ok;
    const camelizedJson = camelCaseKeys(json);
    if (!camelizedJson.isServerOK) {
      return Promise.reject({
        status: response.status,
        ...camelizedJson
      });
    }
    return {...camelizedJson};
  });
}

// Action key that carries API call info interpreted by this Redux middleware.
export const CALL_API = Symbol('Call API');

// A Redux middleware that interprets actions with CALL_API info specified.
// Performs the call and promises when such actions are dispatched.
export default store => next => action => {
  const callAPI = action[CALL_API];
  if (typeof callAPI === 'undefined') {
    return next(action);
  }

  let { endpoint } = callAPI;
  const { types } = callAPI;

  if (typeof endpoint === 'function') {
    endpoint = endpoint(store.getState());
  }

  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.');
  }
  if (!Array.isArray(types) || types.length !== 3) {
    throw new Error('Expected an array of three action types.');
  }
  if (!types.every(type => typeof type === 'string')) {
    throw new Error('Expected action types to be strings.');
  }

  function actionWith(data) {
    const finalAction = {...action, ...data};
    delete finalAction[CALL_API];
    return finalAction;
  }

  function disableActionables () {
    next(actionWith({ type: HANDLE_DISABLE_ACTIONABLES }));
  }

  function enableActionables () {
    next(actionWith({ type: HANDLE_ENABLE_ACTIONABLES }));
  }

  const [requestType, successType, failureType] = types;

  let requestTypeActionData = { type: requestType };
  if (callAPI.requestTypeActionProps) {
    requestTypeActionData = {...requestTypeActionData, ...callAPI.requestTypeActionProps};
  }
  next(actionWith(requestTypeActionData));

  disableActionables();

  return callApi(endpoint).then(
    response => {
      // success handler
      enableActionables();
      callAPI.successTypeActionProps = callAPI.successTypeActionProps || {};
      next(actionWith({ type: successType, ...callAPI.successTypeActionProps, response }));

      const { onSuccess } = callAPI;
      if (onSuccess){
        if (typeof onSuccess !== 'function' ) {
          throw new Error('Success Callback should be a function');
        }
        onSuccess(response, store.getState(), store.dispatch);
      }

    },
    response => {
      // failure handler
      enableActionables();
      switch (response.status) {
        case 401:
        case 403:
          if (Object.keys(store.getState()).includes('dashboard')) {
            // 401 UnAuthorized or 403 forbidden redirects to be done only for logged in pages
            location.pathname = `/accounts/login/?next=${encodeURIComponent(location.pathname)}`;
            return;
          }
          // for public pages, mark the user as logged out
          next(actionWith({ type: MARK_USER_LOGGED_OUT }));
          break;

        case 404:
          next(actionWith({ type: MARK_PAGE_NOT_FOUND }));
          break;
      }

      next(actionWith({
        type: failureType,
        error: response.message || 'Something bad happened'
      }));

      const { onFailure } = callAPI;

      if (onFailure){
        if (typeof onFailure !== 'function' ) {
          throw new Error('Failure Callback should be a function');
        }
        onFailure(response, store.getState(), store.dispatch);
      }
    }
  );
};
