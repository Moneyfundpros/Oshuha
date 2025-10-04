import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIGuide from '@/components/AIGuide';

export default function GetIDButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="mt-4 animate-pulse hover:animate-none border-2 border-primary/50 hover:border-primary hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        style={{
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Get your ID / Reg no
        <style>
          {`
            @keyframes pulse-glow {
              0%, 100% {
                box-shadow: 0 0 10px rgba(var(--primary-rgb, 59, 130, 246), 0.5);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 0 20px rgba(var(--primary-rgb, 59, 130, 246), 0.8);
                transform: scale(1.05);
              }
            }
          `}
        </style>
      </Button>
      <AIGuide open={open} onOpenChange={setOpen} />
    </>
  );
}
