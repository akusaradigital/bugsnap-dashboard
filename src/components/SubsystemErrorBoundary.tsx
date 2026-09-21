"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SubsystemErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SubsystemErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={`flex flex-col items-center justify-center p-6 text-center rounded-xl border border-border bg-subtle/50 text-foreground ${
            this.props.className || "min-h-[200px]"
          }`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {this.props.fallbackTitle || "Component error"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted">
            {this.props.fallbackDescription ||
              this.state.error?.message ||
              "An unexpected error occurred while rendering this section."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-foreground border border-border hover:bg-subtle transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
