
import React from 'react';
import { TICKER_KEYS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

const Ticker: React.FC = () => {
  const { t } = useTranslation();
  const tickerItems = TICKER_KEYS.map(key => t(key));
  const doubledItems = [...tickerItems, ...tickerItems];

  return (
    <div className="relative z-10 py-4 overflow-hidden border-y border-lw-border bg-lw-green/5">
      <div className="flex w-max animate-ticker-scroll">
        {doubledItems.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-10 whitespace-nowrap text-xs text-lw-green-deep tracking-wider uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-lw-green inline-block" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
