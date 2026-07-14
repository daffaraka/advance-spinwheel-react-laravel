import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

// Laravel Inertia 2+ stores page data in a script tag instead of data-page attribute
const pageScript = document.querySelector('script[data-page="app"]');
const initialPage = pageScript ? JSON.parse(pageScript.textContent) : undefined;

createInertiaApp({
  page: initialPage,
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });
    return pages[`./pages/${name}.jsx`];
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
