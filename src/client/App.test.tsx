// import React from 'react';
// import { render, screen } from '@testing-library/react';
// import App from './App';

// test('renders learn react link', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

describe('example', () => {
  it('works', () => {
    const message: string = 'Hello';
    expect(message).toBe('Hello');
  });
});

export {}