import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

type NewsView = 'internal' | 'external';

type GlobalNewsItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  publishedAt: string;
};

type InternalNewsProps = {
  initialView?: NewsView;
};

const GLOBAL_NEWS_ITEMS: GlobalNewsItem[] = [
  {
    id: 'ai-transforming-business',
    title: 'How Artificial Intelligence Is Transforming Business',
    description:
      'AI is a broad term that refers to computer software that engages in human-like activities, including learning, planning, and problem-solving. AI’s most prevalent business use cases now involve generative AI, machine learning (ML), and deep learning, with generative AI experiencing explosive growth in the past few years.',
    link: 'https://www.businessnewsdaily.com/9402-artificial-intelligence-business-trends.html',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    publishedAt: 'Global News',
  },
  {
    id: 'ai-agents-global-economy',
    title: 'AI Agents Changing Every Industry: Reshaping the Global Economy in Agentic Revolution',
    description:
      'The global economy is on the cusp of a paradigm shift driven by the emergence of Artificial Intelligence (AI) agents. These are not merely advanced chatbots or more efficient automation tools; they represent a fundamentally new class of digital actors capable of autonomous, goal-oriented action.',
    link: 'https://www.klover.ai/ai-agents-changing-every-industry-reshaping-global-economy-agentic-revolution/',
    imageUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    publishedAt: 'Global News',
  },
  {
    id: 'ai-pros-cons-debate',
    title: 'Artificial Intelligence | Pros, Cons, Debate, Arguments, Computer Science, & Technology',
    description:
      'Artificial intelligence (AI) is the use of computers and machines to mimic the problem-solving and decision-making capabilities of the human mind. The idea of AI dates back at least 2,700 years, with ancient myths and early concepts exploring forms of artificial life and self-moving devices.',
    link: 'https://www.britannica.com/procon/artificial-intelligence-AI-debate',
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1683121710572-7723bd2e235d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QWl8ZW58MHx8MHx8fDA%3D',
    publishedAt: 'Global News',
  },
];

const LOCAL_NEWS_ITEMS: GlobalNewsItem[] = [
  {
    id: 'ai-agents-capable-reliability-lagging',
    title: 'AI agents are getting more capable, but reliability is lagging-and that\u2019s a problem',
    description:
      "Like many of you, I've started playing around with AI agents. I often use them for research, where they work pretty well and save me substantial amounts of time. But so-called \"deep research\" agents have been available for over a year now, which makes them a relatively mature product in the AI world. I've also started trying the new crop of computer-using agents for other tasks. And here, my experience so far is that these agents are highly inconsistent.",
    link: 'https://fortune.com/2026/03/24/ai-agents-are-getting-more-capable-but-reliability-is-lagging-narayanan-kapoor/',
    imageUrl:
      'https://fortune.com/img-assets/wp-content/uploads/2026/03/GettyImages-1815307952-e1774374184248.jpg?format=webp&w=768&q=100',
    publishedAt: 'March 24, 2026',
  },
  {
    id: 'coca-cola-ai-marketing',
    title: 'Coca-Cola turns to AI marketing as price-led growth slows',
    description:
      'Recent coverage of the company\u2019s leadership discussions shows that Coca-Cola is entering what executives describe as a new phase focused on influence not pricing power. According to Mi-3, the company is changing its focus from "price to persuasion," with digital platforms, AI, and in-store execution becoming increasingly important in building demand. This reflects a change in consumer brand behaviour as inflation pressures ease and companies seek new strategies to maintain revenue growth.',
    link: 'https://www.artificialintelligence-news.com/news/coca-cola-turns-to-ai-marketing-as-price-led-growth-slows/',
    imageUrl:
      'https://www.artificialintelligence-news.com/wp-content/uploads/2026/02/Coca-Cola-turns-to-AI-marketing-as-price-led-growth-slows-1024x683.jpg',
    publishedAt: 'February 20, 2026',
  },
  {
    id: 'securing-ai-systems-conditions',
    title: "Securing AI systems under today's and tomorrow's conditions",
    description:
      "Evidence cited in an eBook titled \"AI Quantum Resilience\", published by Utimaco [email wall], shows organisations consider security risks as the leading barrier to effective adoption of AI on data they hold. AI's value depends on data amassed by an organisation. However, there are security risks to building models and training them on that data. These risks are in addition to better-publicised threats to intellectual property that exist around the point of inference (prompt engineering, for example).",
    link: 'https://www.artificialintelligence-news.com/news/quantum-resilient-ai-needs-migration-and-hardware-protected-data-enclaves/',
    imageUrl:
      'https://www.artificialintelligence-news.com/wp-content/uploads/2026/03/quantum-resistant-ai-hero_x1440.webp',
    publishedAt: 'March 24, 2026',
  },
];

const LOCAL_NEWS_BACKGROUND =
  'https://images.unsplash.com/photo-1771757737915-713727193271?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TE9DQUwlMjBORVdTfGVufDB8fDB8fHww';

const GLOBAL_NEWS_BACKGROUND =
  'https://plus.unsplash.com/premium_photo-1707080369554-359143c6aa0b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Z2xvYmFsJTIwTkVXU3xlbnwwfHwwfHx8MA%3D%3D';

const InternalNews: React.FC<InternalNewsProps> = ({ initialView = 'internal' }) => {
  const { t } = useTranslation();
  const [newsView, setNewsView] = useState<NewsView>(initialView);
  const activeBackground = newsView === 'internal' ? LOCAL_NEWS_BACKGROUND : GLOBAL_NEWS_BACKGROUND;

  useEffect(() => {
    setNewsView(initialView);
  }, [initialView]);

  const handleViewChange = (nextView: NewsView) => {
    setNewsView(nextView);
    window.location.hash = nextView === 'internal' ? '#/internal-news' : '#/external-news';
  };

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8 md:px-20 z-10 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-sm scale-110"
        style={{
          backgroundImage: `url(${activeBackground})`,
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
                  : 'Global updates from trusted sources around the world, curated for quick reading.'}
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
              {LOCAL_NEWS_ITEMS.map((item) => (
                <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="group block cursor-pointer no-underline">
                  <div className="aspect-video overflow-hidden rounded-2xl mb-6 bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">{item.publishedAt}</div>
                  <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">{item.title}</h3>
                  <p className="text-lw-text-body text-sm leading-relaxed">{item.description}</p>
                </a>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {GLOBAL_NEWS_ITEMS.map((item) => (
              <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="group block cursor-pointer no-underline">
                <div className="aspect-video overflow-hidden rounded-2xl mb-6 bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">{item.publishedAt}</div>
                <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">{item.title}</h3>
                <p className="text-lw-text-body text-sm leading-relaxed">{item.description}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalNews;
