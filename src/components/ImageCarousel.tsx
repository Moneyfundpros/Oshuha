import { useState, useEffect } from 'react';
import classroomImage from '@/assets/classroom-collaboration.jpg';
import digitalToolsImage from '@/assets/digital-tools.jpg';
import innovationImage from '@/assets/innovation-education.jpg';

const images = [
  {
    src: classroomImage,
    alt: 'Collaborative Classrooms',
  },
  {
    src: digitalToolsImage,
    alt: 'Digital Tools & Feedback',
  },
  {
    src: innovationImage,
    alt: 'Innovation & Upgrade',
  },
];

export function ImageCarousel() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      ))}
      
      {/* Indicator dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentImage 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
