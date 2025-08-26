import { render, screen } from '@testing-library/react';
import App from './App';

test('renders authentication screen for unauthenticated user', () => {
  // ensure no user in localStorage
  try { localStorage.removeItem('notes-auth-user'); } catch {}
  render(<App />);
  const heading = screen.getByText(/sign in/i);
  expect(heading).toBeInTheDocument();
});
