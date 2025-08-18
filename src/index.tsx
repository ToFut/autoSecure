import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './store/index';
import { MapProvider } from './contexts/MapContext';
import './index.css';
import App from './App';

// Add Font Awesome CDN
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(link);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <MapProvider>
        <BrowserRouter>
          <App />
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(10, 10, 10, 0.95)',
              color: '#fff',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            success: {
              iconTheme: {
                primary: '#00ff88',
                secondary: '#000',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff3b30',
                secondary: '#000',
              },
            },
          }}
        />
        </BrowserRouter>
      </MapProvider>
    </Provider>
  </React.StrictMode>
);

