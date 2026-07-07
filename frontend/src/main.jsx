import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import App from './App'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Contact from './pages/Contact'
import RefundPolicy from './pages/RefundPolicy'
import Success from './pages/Success'
import Cancel from './pages/Cancel'
import Admin from './pages/Admin'
import './index.css'

function ScrollToRouteTarget() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      if (hash) {
        const targetId = decodeURIComponent(hash.slice(1));

        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [hash, pathname]);

  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToRouteTarget />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />                
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
