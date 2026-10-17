import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  window.localStorage.clear();
  document.head.innerHTML = '';
  document.title = '';
});

afterEach(() => {
  cleanup();
});
