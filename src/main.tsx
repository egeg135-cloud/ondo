import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminApp from './AdminApp.tsx'
import './index.css'

// 간단 라우팅: /admin 경로면 운영자 화면, 그 외엔 일반 사용자 화면
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAdmin ? <AdminApp /> : <App />}</React.StrictMode>,
)
