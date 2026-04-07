import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const renderRoute = (element, entry = '/secret') => {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/secret" element={element} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    mockUseAuth.mockReset();
  });

  test('shows the loading spinner while auth state is resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    renderRoute(
      <ProtectedRoute allowedRoles={["OFFICER"]}>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderRoute(
      <ProtectedRoute allowedRoles={["OFFICER"]}>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('renders children when the role is allowed', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'OFFICER' }, loading: false });

    renderRoute(
      <ProtectedRoute allowedRoles={["OFFICER"]}>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});
