import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';


const testimonials = [
  {
    name: 'Amina Johnson',
    role: 'Trainee Teacher',
    avatar: 'AJ',
    quote: "PracticePortal made my teaching placement structured and easy to track. My supervisor's feedback was precise and helpful, allowing me to improve rapidly.",
  },
  {
    name: 'Mr. K. Osei',
    role: 'Practice Supervisor',
    avatar: 'KO',
    quote: 'The reporting features save us hours every week. Exporting class progress helps with accreditation and provides valuable insights into trainee development.',
  },
  {
    name: 'Yemi Williams',
    role: 'Practice Coordinator',
    avatar: 'YW',
    quote: 'I can monitor improvements across trainees and provide targeted help — the dashboard is very informative and makes coordination effortless.',
  },
  {
    name: 'Sarah Chen',
    role: 'Student Teacher',
    avatar: 'SC',
    quote: 'The platform transformed my teaching practice experience. I could track my progress and see exactly where I needed to improve.',
  },
  {
    name: 'Dr. James Wilson',
    role: 'University Coordinator',
    avatar: 'JW',
    quote: 'Managing hundreds of students became simple. The analytics help us identify trends and provide better support to our teaching candidates.',
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">What Our Users Say</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real experiences from trainees and supervisors using PracticePortal
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6 transition-all duration-500">
            {visibleTestimonials.map((testimonial, index) => (
              <Card 
                key={`${currentIndex}-${index}`}
                className="p-6 space-y-4 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur border-primary/20 animate-fade-in"
              >
                <Quote className="h-8 w-8 text-primary/40" />
                
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-primary/30 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
