// src/components/Hero.jsx
import React from 'react';
import { Button } from '../ui/Button';

export const Hero = () => {
  return (
    <section 
      className="relative min-h-[80vh] w-full flex items-center justify-center px-4 md:px-24 py-12 section-divider"
      style={{ 
        '--hero-background': "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSN8lvtaOg6W_MGhl6-wyAT-Kq-WA-DJiXHCmlBNP_b0XP90tScMU47F2Q&s=10')"
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-x-0 top-0 bottom-[50px] z-0 bg-black/50"></div>

      {/* Main Flex Row Wrapper */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 w-full mx-auto">
        
        {/* Left Column (The Story of Art) */}
        <div className="w-full md:w-1/2 text-center md:text-left text-white space-y-6">
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-wide leading-normal">
            Your Skills have Value  <br />
            Let's Bridge the Gap
          </h1>
          
          <p className="text-sm md:text-lg font-sans text-gray-200 leading-relaxed">
           Turn the skills you already have into new opportunities. Learn, connect with buyers, and grow your livelihood — one step at a time.
          </p>
        
      <p className='text-lg'>Local skills ·  Fair opportunities ·  Community support</p>
          <div className="flex gap-4 justify-center md:justify-start pt-2">
            <Button href="/marketplace" className="text-base px-6 py-3">
              Explore Crafts
            </Button>
            <Button href="#how-it-works" className="bg-transparent border border-white hover:bg-white hover:text-black text-base px-6 py-3">
              Learn More
            </Button>
          </div>
        </div>

        {/* Right Column (Vansh Description) */}
        <div className="w-full md:w-1/2 text-center md:text-left text-white space-y-4 bg-black/20 p-6 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold border-b border-white/20 pb-2">Made with skill. Connected with opportunity.</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            SkillBridge brings artisans, customers, industry partners, and learning together to recognise the value of handmade work and make room for new possibilities.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Hero;
