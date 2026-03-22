import { audioServiceBg, imageServiceBg } from './assets/images';

export const NAV_LINKS = [
  { key: "nav.home", href: "#/" },
  {
    key: "nav.aiInitiatives",
    href: "#innovation",
    children: [
      { key: "nav.aiServices", href: "#/aiservices" },
      { key: "nav.aiProjects", href: "#/aiprojects" },
    ],
  },
  {
    key: "nav.ourCompany",
    href: "#/about",
    children: [
      
      { key: "nav.aboutUs", href: "#/about" },
      { key: "nav.offices", href: "#/offices" },
    ],
  },
  {
    key: "nav.whatWeOffer",
    href: "#/tads",
    children: [
      { key: "nav.typeA", href: "#/tads" },
      { key: "nav.typeB", href: "#/horizontal" },
      { key: "nav.typeC", href: "#/vertical" },
      { key: "nav.typeD", href: "#/typed" },
    ],
  },
  { key: "nav.philanthropy", href: "#/phipact" },
  { key: "nav.careers", href: "#/careers" },
  { key: "nav.contactUs", href: "#/contact" },
  {
    key: "nav.news",
    href: "#/internal-news",
    children: [
      { key: "nav.internalNews", href: "#/internal-news" },
      { key: "nav.externalNews", href: "#/external-news" },
    ],
  },
];

export const TICKER_KEYS = [
  "ticker.item1", "ticker.item2", "ticker.item3",
  "ticker.item4", "ticker.item5", "ticker.item6", "ticker.item7",
];

export const ACCORDION_DATA = [
  {
    titleKey: "stats.accordion.item1.title",
    contentKey: "stats.accordion.item1.content",
    bgColor: "bg-lw-accordion-beige",
    textColor: "text-lw-text-dark",
    iconBg: "bg-white",
    iconColor: "text-lw-text-dark",
  },
  {
    titleKey: "stats.accordion.item2.title",
    contentKey: "stats.accordion.item2.content",
    bgColor: "bg-lw-accordion-orange",
    textColor: "text-lw-text-dark",
    iconBg: "bg-white/40",
    iconColor: "text-lw-text-dark",
  },
  {
    titleKey: "stats.accordion.item3.title",
    contentKey: "stats.accordion.item3.content",
    bgColor: "bg-lw-accordion-green",
    textColor: "text-white/90",
    iconBg: "bg-white/10",
    iconColor: "text-white",
  },
  {
    titleKey: "stats.accordion.item4.title",
    contentKey: "stats.accordion.item4.content",
    bgColor: "bg-lw-accordion-black",
    textColor: "text-white/90",
    iconBg: "bg-white/10",
    iconColor: "text-white",
  },
];


export const CLIENT_LOGOS = [
    { name: "Google", src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
    { name: "Microsoft", src: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
    { name: "Amazon", src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
    { name: "Meta", src: "https://www.figma.com/design/DNmP1SVzyBfojABh8kOKh6/Meta-Logo--Facebook-logo---Community-?node-id=201-2&t=KbkRW6JEaaguQ0VO-0" },
    { name: "Apple", src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
    { name: "OpenAI", src: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
    { name: "NVIDIA", src: "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg" },
    { name: "IBM", src: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" }
];

export const SERVICES_DATA = [
  { 
    icon: "🎵", 
    titleKey: "services.audio.title", 
    descKey: "services.audio.desc", 
    bgImage: "https://picsum.photos/seed/audio-neon/800/600", 
    gridClasses: 'lg:col-span-2 lg:row-span-2' 
  },
  { 
    icon: "🖼️", 
    titleKey: "services.image.title", 
    descKey: "services.image.desc", 
    bgImage: "https://picsum.photos/seed/camera-tree/800/600", 
    gridClasses: 'lg:col-span-2' 
  },
  { 
    icon: "📝", 
    titleKey: "services.text.title", 
    descKey: "services.text.desc", 
    bgImage: "https://picsum.photos/seed/ai-text/800/600",
    gridClasses: '' 
  },
  { 
    icon: "🎬", 
    titleKey: "services.video.title", 
    descKey: "services.video.desc", 
    bgImage: "https://picsum.photos/seed/video-recording/800/600",
    gridClasses: '' 
  },
];

export const FOOTER_COLS = [
  { titleKey: "footer.company.title", linkKeys: ["footer.company.link1", "footer.company.link2", "footer.company.link3", "footer.company.link4"] },
  { titleKey: "footer.impact.title", linkKeys: ["footer.impact.link1", "footer.impact.link2", "footer.impact.link3", "footer.impact.link4"] },
  { titleKey: "footer.legal.title", linkKeys: ["footer.legal.link1", "footer.legal.link2", "footer.legal.link3", "footer.legal.link4"] },
];

export const FOOTER_LEGAL_LINKS = ["footer.legalLinks.privacy", "footer.legalLinks.cookies", "footer.legalLinks.terms"];
