import { memo } from 'react';

export const LoadingSpinner = memo(() => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
    </div>
  );
});
