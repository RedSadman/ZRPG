import { render } from 'preact';
import { App } from './ui/App.tsx';
import './ui/styles.css';

render(<App />, document.getElementById('app')!);

// Installable and playable offline, in the built game only (a service worker would fight the dev server's reloads).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline play is a bonus; the game runs without it.
    });
  });
}
