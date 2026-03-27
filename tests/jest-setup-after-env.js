import '@testing-library/jest-dom';

afterEach(() => {
  console.warn.mockRestore?.();
  console.error.mockRestore?.();
});
