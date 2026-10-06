import { useLanguage } from "../i18n/LanguageProvider";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Moon, Sun, ArrowUpRight, Menu, X } from 'lucide-react';
import { disclaimer } from '../utils/format';
export function Header() {
  const {
    tr, language, setLanguage
  } = useLanguage();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('ecosite-theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  document.documentElement.classList.toggle('dark', dark);
  const toggle = () => {
    setDark(d => {
      try {
        localStorage.setItem('ecosite-theme', d ? 'light' : 'dark');
      } catch {/* No persistent theme when storage is blocked. */}
      return !d;
    });
  };
  return <header className="site-header"><Link to="/" className="brand" aria-label={tr("EcoSite home")}><span className="brand-mark"><Leaf size={23} /></span><span><strong>{tr("EcoSite")}<span className="brand-period">.</span></strong><small>{tr("RENEWABLE SITE INTELLIGENCE")}</small></span></Link><nav className={menu ? 'header-nav open' : 'header-nav'} aria-label={tr("Main navigation")}><Link to="/analyze" className={location.pathname === '/analyze' ? 'active' : ''} onClick={() => setMenu(false)}>{tr("Site analysis")}</Link><a href="/#how-it-works" onClick={() => setMenu(false)}>{tr("How it works")}</a><a href="/#data-sources" onClick={() => setMenu(false)}>{tr("Data sources ")}<ArrowUpRight size={12} /></a></nav><div className="header-actions"><select className="language-switch" aria-label={tr("Choose language")} value={language} onChange={e=>setLanguage(e.target.value==='ro'?'ro':'en')}><option value="en">English</option><option value="ro">Română</option></select><span className="header-caption"><i />{tr(" Open data. Informed decisions.")}</span><button className="icon-button" onClick={toggle} aria-label={tr(dark ? 'Switch to light mode' : 'Switch to dark mode')}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="mobile-menu icon-button" aria-label={tr("Toggle navigation")} onClick={() => setMenu(v => !v)}>{menu ? <X size={18} /> : <Menu size={18} />}</button></div></header>;
}
export function Footer() {
  const {
    tr
  } = useLanguage();
  return <footer className="site-footer"><div><span className="footer-brand"><Leaf size={15} />{tr(" EcoSite")}</span><span>{tr("Renewable energy, grounded in data.")}</span></div><p>{tr(disclaimer)}</p><small>{tr("Public data. Transparent assumptions.")}</small></footer>;
}
