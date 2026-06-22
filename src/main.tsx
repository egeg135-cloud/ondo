import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminApp from './AdminApp.tsx'
import DesignPreview from './DesignPreview.tsx'
import './index.css'

const path = window.location.pathname.replace(/\/+$/, '')
const isAdmin = path === '/admin'
const isDesign = new URLSearchParams(window.location.search).has('design')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDesign ? <DesignPreview /> : isAdmin ? <AdminApp /> : <App />}
  </React.StrictMode>,
)
