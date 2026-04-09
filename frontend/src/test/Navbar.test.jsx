import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { AuthProvider } from '../context/AuthContext';

// Mock Lucide icons to avoid rendering complexities in test
vi.mock('lucide-react', () => ({
  LogOut: () => <div data-testid="logout-icon" />,
  User: () => <div data-testid="user-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  X: () => <div data-testid="x-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
}));

describe('Navbar Component', () => {
  it('renders the session status label', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar onMenuClick={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Status/i)).toBeInTheDocument();
  });

  it('displays the status label', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar onMenuClick={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Status/i)).toBeInTheDocument();
  });

  it('renders the hamburger menu button', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar onMenuClick={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );
    
    const menuButton = screen.getByLabelText(/Open menu/i);
    expect(menuButton).toBeInTheDocument();
  });
});
