import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (String(url).includes('/public/specialities')) {
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });
    }

    if (String(url).includes('/public/dashboard')) {
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          totalUsers: 0,
          totalApplicants: 0,
          totalApplications: 0,
          underReview: 0,
          missingDocs: 0,
          accepted: 0,
          rejected: 0,
          specialityStats: [],
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
  });
});

afterEach(() => {
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

test('renders admissions system landing', async () => {
  render(<App />);
  expect(await screen.findByText(/Система учета приемной комиссии/i)).toBeInTheDocument();
});
