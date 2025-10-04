import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function WelcomeDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    if (user) {
      checkWelcomeStatus();
    }
  }, [user]);

  const checkWelcomeStatus = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      const userData = userDoc.data();

      if (userData) {
        setUserName(userData.name || 'there');
        setUserRole(userData.role || '');

        if (!userData.welcomeShown) {
          setIsFirstTime(true);
          setOpen(true);
        } else {
          const lastLogin = userData.lastLoginShown;
          const now = Date.now();
          const shouldShow = !lastLogin || now - lastLogin > 60000;

          if (shouldShow) {
            setIsFirstTime(false);
            setOpen(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking welcome status:', error);
    }
  };

  const handleClose = async () => {
    try {
      const updates: any = {
        lastLoginShown: Date.now(),
      };

      if (isFirstTime) {
        updates.welcomeShown = true;
      }

      await updateDoc(doc(db, 'users', user!.uid), updates);
      setOpen(false);
    } catch (error) {
      console.error('Error updating welcome status:', error);
      setOpen(false);
    }
  };

  const getRoleDisplay = () => {
    if (userRole === 'supervisor') return 'Supervisor';
    if (userRole === 'coordinator') return 'Coordinator';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 animate-pulse">
                <Heart className="h-12 w-12 text-white fill-white" />
              </div>
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            {isFirstTime ? `Welcome, ${userName}!` : `Welcome Back, ${userName}!${getRoleDisplay() ? ` (${getRoleDisplay()})` : ''}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isFirstTime ? (
            <div className="text-center space-y-3">
              <p className="text-lg leading-relaxed">
                We're absolutely delighted to have you join the PracticePortal family!
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Your journey towards excellence in teaching begins here. We've created this platform
                with care and dedication to support you every step of the way.
              </p>

              <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm italic text-center">
                  "Teaching is the one profession that creates all other professions.
                  Welcome to your path of making a difference."
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Explore your dashboard, connect with your {userRole === 'student' ? 'supervisor' : 'team'}, and embark on this
                meaningful experience with confidence. We're here to support you!
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-lg leading-relaxed">
                Great to see you again! {getRoleDisplay() && `We hope you're having a productive day as a ${getRoleDisplay()}.`}
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Continue your excellent work on the platform. Your dedication makes a difference!
              </p>

              <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm italic text-center">
                  "Excellence is not a destination; it is a continuous journey that never ends."
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600"
            size="lg"
          >
            {isFirstTime ? "Let's Get Started!" : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
