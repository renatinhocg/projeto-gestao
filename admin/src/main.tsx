import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AdminRouter } from 'react-admin'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
