import React from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export type NavigationItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type NavigationProps = {
  items: NavigationItem[];
};

export function Navigation({ items }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-md mx-auto flex justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2 px-4 flex-1 transition-colors',
                  isActive ? 'text-amber-700 dark:text-amber-500' : 'text-neutral-500 dark:text-neutral-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`size-5 ${
                      isActive ? 'text-amber-700 dark:text-amber-500' : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isActive ? 'text-amber-700 dark:text-amber-500' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}