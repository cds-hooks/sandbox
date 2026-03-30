import '@testing-library/jest-dom';

afterEach(() => {
  console.error.mockRestore?.();
  console.warn.mockRestore?.();
  console.log.mockRestore?.();
});
