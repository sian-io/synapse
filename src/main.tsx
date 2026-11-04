import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
const lightMode = window.matchMedia('(prefers-color-scheme: light)');
const syncFavicon = () => {
  if (favicon) favicon.href = lightMode.matches ? '/favicon-light.svg' : '/favicon.svg';
};
syncFavicon();
lightMode.addEventListener('change', syncFavicon);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
