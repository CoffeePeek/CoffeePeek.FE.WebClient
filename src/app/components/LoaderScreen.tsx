import React from 'react';

type LoaderScreenProps = {
  message?: string;
};

export function LoaderScreen({ message = 'Загрузка...' }: LoaderScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 mx-auto border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{message}</p>
      </div>
    </div>
  );
}

