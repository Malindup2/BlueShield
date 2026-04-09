import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const TestComponent = () => {
  const { user, login } = useAuth();
  return (
    <div>
      <div data-testid="user-name">{user ? user.name : 'Guest'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides the initial guest state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
  });

  it('updates the user state after a successful login', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'OFFICER', token: 'fake-jwt-token' };
    
    axios.post.mockResolvedValueOnce({
      data: mockUser
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(axios.post).toHaveBeenCalled();
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
  });
});
