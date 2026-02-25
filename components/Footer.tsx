
import React from 'react';
import { FOOTER_COLS, FOOTER_LEGAL_LINKS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

const socialLinks = [
  { label: "in", url: "https://ph.linkedin.com/company/lifewood-data-technology-ltd." },
  { label: "fb", url: "https://www.facebook.com/LifewoodPH/" },
  { label: "ig", url: "https://www.instagram.com/lifewoodph/" },
  { label: "yt", url: "https://www.youtube.com/@LifewoodDataTechnology" }
];

const linkMap: { [key: string]: string } = {
  "footer.company.link1": "#/about",
  "footer.company.link2": "#innovation",
  "footer.company.link3": "#/tads",
  "footer.company.link4": "#/offices",
  "footer.impact.link1": "#/phipact",
  "footer.impact.link2": "#/careers",
  "footer.impact.link3": "#/internal-news",
  "footer.impact.link4": "#/contact",
  "footer.legal.link1": "#/privacy-policy",
  "footer.legal.link2": "#/cookie-policy",
  "footer.legal.link3": "#/terms-and-conditions",
};

const legalLinkMap: { [key: string]: string } = {
  "footer.legalLinks.privacy": "#/privacy-policy",
  "footer.legalLinks.cookies": "#/cookie-policy",
  "footer.legalLinks.terms": "#/terms-and-conditions",
};

interface FooterProps {
  onCookieSettingsClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onCookieSettingsClick }) => {
  const { t } = useTranslation();

  const handleLinkClick = (e: React.MouseEvent, key: string) => {
    if ((key === "footer.legal.link4" || key === "footer.legalLinks.cookies") && onCookieSettingsClick) {
      e.preventDefault();
      onCookieSettingsClick();
    }
  };

  return (
    <footer className="relative z-10 px-8 md:px-20 pt-16 pb-10 border-t border-lw-border bg-lw-bg-dark">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <a href="#" className="no-underline">
             <img src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429" alt="Lifewood Logo" className="h-8 w-auto" />
          </a>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed mt-4">
            {t('footer.description')}
          </p>
          <div className="flex gap-3 mt-6">
            {socialLinks.map(s => (
              <a 
                key={s.label} 
                href={s.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-lw-green/30 flex items-center justify-center text-white/50 no-underline font-bold text-xs transition-colors hover:bg-lw-green/20 hover:text-white uppercase"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
        {FOOTER_COLS.map(col => (
          <div key={col.titleKey} className="lg:justify-self-center">
            <h4 className="text-xs font-bold tracking-[2.5px] uppercase text-lw-green mb-5">{t(col.titleKey)}</h4>
            <ul className="list-none space-y-3">
              {col.linkKeys.map(key => (
                <li key={key}>
                  <a 
                    href={linkMap[key] || "#"} 
                    onClick={(e) => handleLinkClick(e, key)}
                    className="text-white/50 no-underline text-sm hover:text-white transition-colors"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs text-white/40">
        <span>{t('footer.copyright')}</span>
        <div className="flex gap-6 mt-4 sm:mt-0">
          {FOOTER_LEGAL_LINKS.map(key => (
            <a 
              key={key} 
              href={legalLinkMap[key] || "#"} 
              onClick={(e) => handleLinkClick(e, key)}
              className="text-white/40 no-underline hover:text-white transition-colors"
            >
              {t(key)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
