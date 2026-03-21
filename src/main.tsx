import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { Toaster } from 'react-hot-toast'
import './index.css'

document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#162433',
            color: '#e2f0f7',
            border: '1px solid #1e3a4a',
            fontSize: '14px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#4dd9ac',
              secondary: '#162433',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#162433',
            },
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
)