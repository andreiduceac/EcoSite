import { useLanguage } from "./i18n/LanguageProvider";
import { Routes, Route, Link } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { Landing } from './pages/Landing';
import { Workspace } from './pages/Workspace';
export function App() {
  const {
    tr
  } = useLanguage();
  return <><Header /><Routes><Route path="/" element={<Landing />} /><Route path="/analyze" element={<Workspace />} /><Route path="*" element={<main className="error-page"><h1>{tr("Page not found")}</h1><Link to="/">{tr("Return to EcoSite")}</Link></main>} /></Routes><Footer /></>;
}
