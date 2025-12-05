interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Something went wrong', message, onRetry }: ErrorMessageProps) {
  return (
    <div 
      className="rounded-lg p-6 border text-center max-w-md mx-auto"
      style={{ 
        backgroundColor: 'rgba(248, 113, 113, 0.05)',
        borderColor: 'rgba(248, 113, 113, 0.2)',
      }}
    >
      <div 
        className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)' }}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="var(--color-error)" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      
      <h3 
        className="text-lg font-medium mb-2"
        style={{ color: 'var(--color-error)' }}
      >
        {title}
      </h3>
      
      <p 
        className="text-sm mb-4"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary text-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

