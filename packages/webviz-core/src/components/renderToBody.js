// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import * as React from "react";
import ReactDOM, { render, unmountComponentAtNode } from "react-dom";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";

import getGlobalStore from "webviz-core/src/store/getGlobalStore";
import history from "webviz-core/src/util/history";
import { useForceUpdate } from "webviz-core/src/util/hooks.js";

type RenderedToBodyHandle = {| update: (React.Element<*>) => void, remove: () => void |};

// TODO(Audrey): change the `any` time to React.Element<*> and flow errors.
export default function renderToBody(element: any): RenderedToBodyHandle {
  const container = document.createElement("div");
  container.dataset.modalcontainer = "true";
  if (!document.body) {
    throw new Error("document.body not found"); // appease flow
  }
  document.body.appendChild(container);

  function ComponentToRender({ children }) {
    return (
      <Provider store={getGlobalStore()}>
        <Router history={history}>{children}</Router>
      </Provider>
    );
  }

  render(<ComponentToRender>{element}</ComponentToRender>, container);

  return {
    update(child: React.Element<*>) {
      render(<ComponentToRender>{child}</ComponentToRender>, container);
    },

    remove() {
      unmountComponentAtNode(container);
      if (!document.body) {
        throw new Error("document.body not found"); // appease flow
      }
      document.body.removeChild(container);
    },
  };
}

// Deprecated: Use RenderToBodyPortal instead so all React Contexts work as expected.
// RenderToBodyComponent doesn't use portals, so not all react contexts will be available to the modal content.
export class RenderToBodyComponent extends React.Component<{| children: React.Element<*> |}> {
  _renderedToBodyHandle: ?RenderedToBodyHandle;

  componentDidMount() {
    this._renderedToBodyHandle = renderToBody(this.props.children);
  }

  componentDidUpdate() {
    if (this._renderedToBodyHandle) {
      this._renderedToBodyHandle.update(this.props.children);
    }
  }

  componentWillUnmount() {
    if (this._renderedToBodyHandle) {
      this._renderedToBodyHandle.remove();
    }
  }

  render() {
    return null;
  }
}

// Renders the children in the body of the page using a portal.
export function RenderToBodyPortal({ children }: { children: React$Node }) {
  const container = React.useRef(null);
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    container.current = document.createElement("div");
    container.current.dataset.modalcontainer = "true";
    if (!document.body) {
      throw new Error("document.body not found"); // appease flow
    }
    document.body.appendChild(container.current);
    forceUpdate();

    return () => {
      if (!document.body) {
        throw new Error("document.body not found"); // appease flow
      }
      if (container.current) {
        document.body.removeChild(container.current);
      }
    };
  }, [forceUpdate]);

  return container.current && ReactDOM.createPortal(children, container.current);
}
