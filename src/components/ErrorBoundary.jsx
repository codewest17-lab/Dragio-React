import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Dragio render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 32 }}>error</span>
          <h3 style={{ marginTop: 12 }}>Something went wrong</h3>
          <p style={{ marginTop: 4 }}>Try reloading this page.</p>
          <button className="btn btn-primary" style={{ width: "auto", padding: "10px 20px", marginTop: 16 }} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
