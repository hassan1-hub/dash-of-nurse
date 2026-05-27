 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { Component } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";










class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        React.createElement('div', { className: "flex items-center justify-center min-h-screen p-8 bg-background"     ,}
          , React.createElement('div', { className: "flex flex-col items-center w-full max-w-2xl p-8"     ,}
            , React.createElement(AlertTriangle, {
              size: 48,
              className: "text-destructive mb-6 flex-shrink-0"  ,}
            )

            , React.createElement('h2', { className: "text-xl mb-4" ,}, "An unexpected error occurred."   )

            , React.createElement('div', { className: "p-4 w-full rounded bg-muted overflow-auto mb-6"     ,}
              , React.createElement('pre', { className: "text-sm text-muted-foreground whitespace-break-spaces"  ,}
                , _optionalChain([this, 'access', _ => _.state, 'access', _2 => _2.error, 'optionalAccess', _3 => _3.stack])
              )
            )

            , React.createElement('button', {
              onClick: () => window.location.reload(),
              className: cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              ),}

              , React.createElement(RotateCcw, { size: 16,} ), "Reload Page"

            )
          )
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
