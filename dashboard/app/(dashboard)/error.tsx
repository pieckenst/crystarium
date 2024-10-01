'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import * as client from "react-dom/client";

// Add trace logging for hydration errors
const oldClientHydrateRoot = client.hydrateRoot;
const newHydrateRoot = new Proxy(oldClientHydrateRoot, {
  apply: (wrappingTarget, thisArg, args) => {
    const oldOnRecoverableError = args[2].onRecoverableError;

    args[2].onRecoverableError = new Proxy(oldOnRecoverableError, {
      apply: (inner_wrappingTarget, inner_thisArg, inner_args) => {
        const error = inner_args[0];
        const errorInfo = inner_args[1];
 
        // Log out error + `componentStack` in production
        console.log(error, errorInfo.componentStack);

        // If using Sentry, uncomment the following line:
        // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });

        return inner_wrappingTarget.apply(inner_thisArg, inner_args);
      },
    });

    return wrappingTarget.apply(thisArg, args);
  },
});

// Override the original hydrateRoot with our new proxy
client.hydrateRoot = newHydrateRoot;

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    console.error(error);
    setErrorDetails(getErrorDetails(error));
  }, [error]);

  function getErrorDetails(error: Error): string {
    if (error.message.includes('Failed to load config')) {
      return 'Configuration error: Please check your config.json file.';
    } else if (error.message.includes('Token not found')) {
      return 'Authentication error: Please check your .env file for the token.';
    } else if (error.message.includes('Failed to start dashboard server')) {
      return 'Server error: Unable to start the dashboard server. Check your network settings.';
    } else if (error.message.includes('API request failed')) {
      return 'API error: Unable to fetch data from the server. Please try again later.';
    } else if (error.message.includes('EPERM: operation not permitted')) {
      return 'Permission error: The application does not have sufficient permissions to perform the operation. Please check your file system permissions.';
    } else {
      return `Unexpected error: ${error.message}`;
    }
  }

  return (
    <main className="p-4 md:p-6 bg-background text-foreground">
      <div className="mb-8 space-y-4">
        <h1 className="font-semibold text-lg md:text-2xl text-destructive">
          An error occurred
        </h1>
        <p className="text-muted-foreground">
          We apologize for the inconvenience. Here are the details of the error:
        </p>
        <pre className="my-4 px-3 py-4 bg-muted text-muted-foreground rounded-lg max-w-2xl overflow-auto">
          <code>{errorDetails}</code>
        </pre>
        <div>
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
