import React from 'react';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  title: string;
  image: string;
  description: string;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, image, description, className = "" }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-xl bg-black ${className}`}
    >
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
        referrerPolicy="no-referrer"
      />
      
      {/* Subtle grid lines visible on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '10% 100%' }}></div>
      </div>

      <div className="absolute top-8 left-8">
        <h3 className="text-white text-2xl font-bold tracking-tight">{title}</h3>
      </div>
      
      <div className="absolute bottom-8 left-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
        <p className="text-white/70 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

const AIDataServices: React.FC = () => {
  return (
    <section className="py-24 bg-white dark:bg-[#050a05] px-8 md:px-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-lw-text-dark dark:text-white mb-6 tracking-tight">
            AI DATA SERVICES
          </h2>
          <p className="text-lw-text-body dark:text-gray-400 text-lg md:text-xl max-w-4xl leading-relaxed">
            Lifewood offers AI and IT services that enhance decision-making, reduce costs, and improve productivity to optimize organizational performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px]">
          {/* Audio - Top Left Large */}
          <ServiceCard 
            title="Audio" 
            image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80" 
            description="Collection, labelling, voice categorization, music categorization, intelligent cs"
            className="md:col-span-8 md:row-span-1"
          />

          {/* Text - Right Tall */}
          <ServiceCard 
            title="Text" 
            image="https://images.unsplash.com/photo-1588287055455-9fb0ca7a2d02?w=800&auto=format&fit=crop&q=80" 
            description="Text, collection, labelling, transcription, utterance collection, sentiment analysis"
            className="md:col-span-4 md:row-span-2"
          />

          {/* Image - Bottom Left */}
          <ServiceCard 
            title="Image" 
            image="https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800&auto=format&fit=crop&q=80" 
            description="Collection, labelling, classification, audit, object detection and tagging"
            className="md:col-span-3 md:row-span-1"
          />

          {/* Video - Bottom Middle */}
          <ServiceCard 
            title="Video" 
            image="https://images.unsplash.com/photo-1607112812619-182cb1c7bb61?w=1000&auto=format&fit=crop&q=80" 
            description="Collection, labelling, audit, live broadcast, subtitle generation"
            className="md:col-span-5 md:row-span-1"
          />
        </div>
      </div>
    </section>
  );
};

export default AIDataServices;
