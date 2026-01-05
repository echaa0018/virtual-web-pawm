// src/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { Homepage } from './components/Homepage';
import { SimulationDetailPage } from './components/SimulationDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Homepage />,
      },
      {
        path: 'simulation/:id',
        element: <SimulationDetailPage />,
      },
    ],
  },
]);
