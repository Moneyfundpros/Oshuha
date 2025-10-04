import { GraduationCap, Shield, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 py-8 bg-secondary/20">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>© {currentYear} PracticePortal — Built for teaching practice excellence</span>
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground items-center">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a
              href="https://wa.me/2349036053739"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors text-green-600"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <Link
              to="/admin-login"
              className="flex items-center gap-1 hover:text-foreground transition-colors text-primary"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
