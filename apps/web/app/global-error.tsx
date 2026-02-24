'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground font-sans antialiased">
        <div className="flex flex-col items-center justify-center p-4 gap-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-destructive">
              System Error
            </h2>
            <p className="text-muted-foreground max-w-md">
              The application has encountered a critical error and cannot
              recover automatically.
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg text-sm font-mono text-left w-full max-w-md overflow-auto border">
            {error.message}
            {error.digest && (
              <div className="mt-2 text-xs text-muted-foreground">
                Digest: {error.digest}
              </div>
            )}
          </div>

          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            onClick={() => reset()}
          >
            Restart Application
          </button>
        </div>
      </body>
    </html>
  )
}
