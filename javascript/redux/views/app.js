/*
 *
 *  Demonstration of handling Generic Global DOM level changes in React.
 *  This example shows how to disable and enable all form controls during
 *  a network call via root level connected/smart redux component

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

import React, { Component } from 'react';
import { connect } from 'react-redux';

class App extends Component {
  _handleDisable(formElems) {
    for( let e = 0; e < formElems.length; e++ ) {
      formElems[e].setAttribute('disabled', 'disabled');
    }
  }

  _handleEnable(formElems) {
    for( let e = 0; e < formElems.length; e++ ) {
      formElems[e].removeAttribute('disabled');
    }
  }

  componentDidUpdate () {
    const { pageState: { isInTraffic, isAsync } } = this.props;
    // proceed only if an async network call is pending a response
    if (!isAsync) {
      return;
    }
    const dom = this.refs.baseRef;
    const inputs = dom.getElementsByTagName('input');
    const textareas = dom.getElementsByTagName('textarea');
    const selects = dom.getElementsByTagName('select');
    const buttons = dom.getElementsByTagName('button');

    if (isInTraffic) {
      return [inputs, textareas, selects, buttons].map(this._handleDisable);
    }

    return [inputs, textareas, selects, buttons].map(this._handleEnable);
  }

  render () {
    return (
      <div>
        <Header />
        <Row ref="baseRef">
          <Sidebar />
          <DocumentTitle title="Dashboard">
            <Content {...this.props} />
          </DocumentTitle>
          <RightSidebar />
        </div>
        <Footer />
      </div>
    );
  }
}

function mapStateToProps (state) {
  const { pageState } = state;
  return { pageState };
}

export default connect(mapStateToProps)(App);
