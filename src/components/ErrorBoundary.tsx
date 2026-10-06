import { translateCurrent, LanguageContext } from "../i18n/LanguageProvider";
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
export class ErrorBoundary extends Component<{
  children: ReactNode;
}, {
  failed: boolean;
}> {
  static contextType = LanguageContext;
  state = {
    failed: false
  };
  static getDerivedStateFromError() {
    return {
      failed: true
    };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EcoSite rendering error', error, info.componentStack);
  }
  render() {
    const tr = translateCurrent;
    return this.state.failed ? <main className="error-page"><h1>{tr("We couldn’t display this view.")}</h1><p>{tr("Your browser encountered an unexpected error. Reload EcoSite to start again.")}</p><button onClick={() => window.location.reload()}>{tr("Reload EcoSite")}</button></main> : this.props.children;
  }
}
