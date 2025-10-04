import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const educationalQuotes = [
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "Teaching is the one profession that creates all other professions.",
    author: "Unknown"
  },
  {
    text: "Tell me and I forget, teach me and I may remember, involve me and I learn.",
    author: "Benjamin Franklin"
  },
  {
    text: "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.",
    author: "Brad Henry"
  },
];

export function Hero() {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % educationalQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Practice Teaching.
                <span className="block text-primary">Track Progress.</span>
                <span className="block">Shine.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Student practice portal built for teaching practice — collect scores, manage schools and supervisors, and keep everything organized.
              </p>
            </div>

            {/* Educational Quotes Carousel */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="relative min-h-[100px] flex items-center">
                {educationalQuotes.map((quote, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentQuote ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <p className="text-lg italic text-foreground mb-2">
                      "{quote.text}"
                    </p>
                    <p className="text-sm text-primary font-semibold">
                      — {quote.author}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/signin">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="#how">Learn More</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <Card className="relative p-6 space-y-4 bg-card/50 backdrop-blur border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Student Snapshot</h3>
                  <p className="text-sm text-muted-foreground">Dashboard Preview</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span className="text-sm font-medium">Next Practice</span>
                  <span className="text-sm text-muted-foreground">St. Mary's High</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span className="text-sm font-medium">Current Score</span>
                  <span className="text-sm font-bold text-primary">78%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span className="text-sm font-medium">Status</span>
                  <span className="text-sm text-green-400">On Track</span>
                </div>
              </div>
            </Card>

            <img 
              src={heroImage} 
              alt="Teaching Practice" 
              className="mt-6 rounded-2xl w-full h-64 object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
