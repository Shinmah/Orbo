import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { registerServiceWorker } from './lib/pwa';

const app = mount(App, { target: document.getElementById('app')! });
registerServiceWorker();

export default app;
