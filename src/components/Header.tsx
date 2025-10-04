import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { GraduationCap, LogOut, Moon, Sun } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
          <GraduationCap className="h-6 w-6" />
          PracticePortal
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link to="#how" className="text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </Link>
          <Link to="#education" className="text-muted-foreground hover:text-foreground transition-colors">
            Education
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          {user ? (
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
