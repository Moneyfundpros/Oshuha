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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function WelcomeBackDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (user) {
      checkWelcomeBackStatus();
    }
  }, [user]);

  const checkWelcomeBackStatus = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      const userData = userDoc.data();

      if (userData) {
        setUserName(userData.name || 'there');
        setUserRole(userData.role || '');

        const lastLoginKey = `last_login_${user!.uid}`;
        const lastLogin = localStorage.getItem(lastLoginKey);
        const now = new Date().getTime();

        if (!lastLogin || (now - parseInt(lastLogin)) > 3600000) {
          setOpen(true);
          localStorage.setItem(lastLoginKey, now.toString());
        }
      }
    } catch (error) {
      console.error('Error checking welcome back status:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getRoleDisplay = () => {
    if (userRole === 'supervisor') return 'Supervisor';
    if (userRole === 'coordinator') return 'Coordinator';
    if (userRole === 'student') return 'Student';
    return '';
  };

  const getWelcomeMessage = () => {
    const roleDisplay = getRoleDisplay();
    if (userRole === 'supervisor' || userRole === 'coordinator') {
      return `Welcome back, ${userName}! (${roleDisplay})`;
    }
    return `Welcome back, ${userName}!`;
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
            {getWelcomeMessage()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center space-y-3">
            <p className="text-lg leading-relaxed">
              Great to see you again! Ready to continue your teaching practice journey?
            </p>

            <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm italic text-center">
                "Every day is a new opportunity to inspire and make a difference."
              </p>
            </div>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600"
            size="lg"
          >
            Let's Continue!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
