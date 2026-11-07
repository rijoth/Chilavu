import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/pages/HomePage';
import { EventDetailsPage } from '@/pages/EventDetailsPage';
import { ExpenseDetailsPage } from '@/pages/ExpenseDetailsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'events/:eventId',
        element: <EventDetailsPage />,
      },
      {
        path: 'events/:eventId/expenses/:expenseId',
        element: <ExpenseDetailsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold text-text mb-2">Page Not Found</h2>
            <p className="text-sm text-subtle mb-6 max-w-xs">
              The page you are looking for doesn't exist or has moved.
            </p>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-pine text-white text-sm font-semibold"
            >
              Back to Home
            </a>
          </div>
        ),
      },
    ],
  },
]);
