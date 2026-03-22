import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

type NewsView = 'internal' | 'external';

type ExternalNewsItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  imageUrl: string;
  source: string;
};

type InternalNewsProps = {
  initialView?: NewsView;
};

const WORLD_FEED_URL = 'https://feeds.bbci.co.uk/news/world/rss.xml';
const MIN_EXTERNAL_NEWS = 3;

const parseText = (element: Element, tag: string) =>
  (element.getElementsByTagName(tag)[0]?.textContent || '').trim();

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recent';
  return parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const buildFallbackImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;

const InternalNews: React.FC<InternalNewsProps> = ({ initialView = 'internal' }) => {
  const { t } = useTranslation();
  const [newsView, setNewsView] = useState<NewsView>(initialView);
  const [externalNews, setExternalNews] = useState<ExternalNewsItem[]>([]);
  const [isLoadingExternalNews, setIsLoadingExternalNews] = useState(false);
  const [externalNewsError, setExternalNewsError] = useState('');

  useEffect(() => {
    setNewsView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (newsView !== 'external') return;
    if (externalNews.length >= MIN_EXTERNAL_NEWS) return;

    const fetchExternalNews = async () => {
      setIsLoadingExternalNews(true);
      setExternalNewsError('');

      try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(WORLD_FEED_URL)}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        const xmlError = doc.getElementsByTagName('parsererror')[0];
        if (xmlError) {
          throw new Error('Failed to parse news feed.');
        }

        const items = Array.from(doc.getElementsByTagName('item')).map((item, index) => {
          const title = parseText(item, 'title');
          const link = parseText(item, 'link');
          const description = stripHtml(parseText(item, 'description'));
          const publishedAt = parseText(item, 'pubDate');
          const source = parseText(item, 'source') || 'BBC World';
          const thumbnail = item.getElementsByTagName('media:thumbnail')[0]?.getAttribute('url') || '';
          const enclosure = item.getElementsByTagName('enclosure')[0]?.getAttribute('url') || '';
          const imageUrl = thumbnail || enclosure || buildFallbackImage(`${title || 'world-news'}-${index}`);

          return {
            id: `${link || title || index}`,
            title: title || 'Untitled story',
            description: description || 'Read the full article for details.',
            link: link || '#',
            publishedAt: publishedAt || '',
            imageUrl,
            source,
          } satisfies ExternalNewsItem;
        });

        const topItems = items.slice(0, 6);
        if (topItems.length < MIN_EXTERNAL_NEWS) {
          throw new Error('Not enough external news items found.');
        }

        setExternalNews(topItems);
      } catch (error) {
        console.error('Unable to fetch external news:', error);
        setExternalNewsError('Unable to fetch external news right now. Please try again shortly.');
        setExternalNews([]);
      } finally {
        setIsLoadingExternalNews(false);
      }
    };

    fetchExternalNews();
  }, [newsView, externalNews.length]);

  const handleViewChange = (nextView: NewsView) => {
    setNewsView(nextView);
    window.location.hash = nextView === 'internal' ? '#/internal-news' : '#/external-news';
  };

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8 md:px-20 z-10 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-sm scale-110"
        style={{
          backgroundImage:
            'url(https://media.istockphoto.com/id/1092964832/photo/global-communication-network-concept.webp?a=1&b=1&s=612x612&w=0&k=20&c=RiB_cXiQsT6Sn6sQSCS5btet1uBCsCsEIqVuPjh_Xhw=)',
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-white/70"></div>

      <div className="relative max-w-7xl mx-auto z-10">
        <div className="mb-16">
          <div className="flex items-center gap-2 text-lw-green font-bold uppercase tracking-widest text-xs mb-4">
            <span className="w-8 h-[1px] bg-lw-green"></span>
            {t('nav.news')}
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-lw-text-dark mb-6 tracking-tight">{t('nav.news')}</h1>
              <p className="text-lw-text-body text-xl max-w-3xl leading-relaxed">
                {newsView === 'internal'
                  ? t('internalNewsPage.description')
                  : 'Live global updates from around the world. Stay informed with the latest external headlines.'}
              </p>
            </div>

            <div className="w-full md:w-72">
              <label className="block text-xs font-bold uppercase tracking-widest text-lw-green mb-2">News Category</label>
              <select
                value={newsView}
                onChange={(event) => handleViewChange(event.target.value as NewsView)}
                className="w-full rounded-xl border border-lw-green/30 bg-white/90 px-4 py-3 text-sm font-semibold text-lw-text-dark outline-none focus:border-lw-green"
              >
                <option value="internal">{t('nav.internalNews')}</option>
                <option value="external">{t('nav.externalNews')}</option>
              </select>
            </div>
          </div>
        </div>

        {newsView === 'internal' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-2xl mb-6">
                  <img
                    src="https://picsum.photos/seed/news1/800/600"
                    alt="News 1"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">February 20, 2026</div>
                <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">
                  {t('internalNewsPage.news1.title')}
                </h3>
                <p className="text-lw-text-body text-sm leading-relaxed">{t('internalNewsPage.news1.desc')}</p>
              </div>

              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-2xl mb-6">
                  <img
                    src="https://picsum.photos/seed/news2/800/600"
                    alt="News 2"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">February 15, 2026</div>
                <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">
                  {t('internalNewsPage.news2.title')}
                </h3>
                <p className="text-lw-text-body text-sm leading-relaxed">{t('internalNewsPage.news2.desc')}</p>
              </div>

              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-2xl mb-6">
                  <img
                    src="https://picsum.photos/seed/news3/800/600"
                    alt="News 3"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">February 10, 2026</div>
                <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">
                  {t('internalNewsPage.news3.title')}
                </h3>
                <p className="text-lw-text-body text-sm leading-relaxed">{t('internalNewsPage.news3.desc')}</p>
              </div>
            </div>

            <div className="mt-24 flex justify-center">
              <div className="w-full max-w-5xl bg-[#f5f5f5] p-6 md:p-10 rounded-[2rem] shadow-sm">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/ccyrQ87EJag?si=45FjhZJGcQZf-ZkV"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {isLoadingExternalNews && (
              <div className="rounded-2xl border border-lw-green/20 bg-white/70 p-6 text-lw-text-dark text-sm">
                Loading external world news...
              </div>
            )}

            {!isLoadingExternalNews && externalNewsError && (
              <div className="rounded-2xl border border-red-300 bg-red-50/90 p-6 text-red-700 text-sm">{externalNewsError}</div>
            )}

            {!isLoadingExternalNews && !externalNewsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {externalNews.slice(0, 6).map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group block cursor-pointer no-underline"
                  >
                    <div className="aspect-video overflow-hidden rounded-2xl mb-6 bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-lw-green font-bold text-xs uppercase tracking-wider">{formatDate(item.publishedAt)}</div>
                      <div className="text-xs font-semibold text-lw-text-body">{item.source}</div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">{item.title}</h3>
                    <p className="text-lw-text-body text-sm leading-relaxed">{item.description}</p>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InternalNews;
