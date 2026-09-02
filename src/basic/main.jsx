import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BasicSite from './BasicSite.jsx'
import './basic.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BasicSite />
  </StrictMode>,
)
