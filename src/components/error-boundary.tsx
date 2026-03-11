"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId?: string;
}

/**
 * 전역 에러 경계 컴포넌트
 * 예상치 못한 런타임 오류를 잡아 Sentry에 보고하고 폴백 UI 표시
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            예기치 않은 오류가 발생했습니다
          </h2>
          <p className="text-sm text-muted-foreground">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          {this.state.eventId && (
            <p className="font-mono text-xs text-muted-foreground">
              오류 ID: {this.state.eventId}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
