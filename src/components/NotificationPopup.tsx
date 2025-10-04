import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Heart, Sparkles } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  shown?: boolean;
  createdAt: string;
}

export default function NotificationPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
      subscribeToNotifications();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      const userData = userDoc.data();
      if (userData) {
        setUserName(userData.name || 'there');
        setUserRole(userData.role || 'user');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      const unshownNotifs = notifs.filter(n => !n.shown);

      if (unshownNotifs.length > 0 && !open) {
        setPendingNotifications(unshownNotifs);
        showNextNotification(unshownNotifs);
      }
    });

    return unsubscribe;
  };

  const showNextNotification = (notifs: Notification[]) => {
    if (notifs.length === 0) {
      setOpen(false);
      setCurrentNotification(null);
      return;
    }

    const nextNotif = notifs[0];
    setCurrentNotification(nextNotif);
    setOpen(true);
  };

  const handleClose = async () => {
    if (currentNotification) {
      try {
        await updateDoc(doc(db, 'notifications', currentNotification.id), {
          shown: true,
        });
      } catch (error) {
        console.error('Error updating notification:', error);
      }
    }

    const remaining = pendingNotifications.slice(1);
    setPendingNotifications(remaining);

    if (remaining.length > 0) {
      setTimeout(() => {
        showNextNotification(remaining);
      }, 300);
    } else {
      setOpen(false);
      setCurrentNotification(null);
    }
  };

  const getRoleDisplay = () => {
    if (userRole === 'supervisor') return 'Supervisor';
    if (userRole === 'coordinator') return 'Coordinator';
    return '';
  };

  const getIcon = () => {
    if (currentNotification?.type === 'reminder') {
      return <Bell className="h-12 w-12 text-white" />;
    }
    return <Heart className="h-12 w-12 text-white fill-white" />;
  };

  if (!currentNotification) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className={`p-4 rounded-full ${
                currentNotification.type === 'reminder'
                  ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
                  : 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'
              } animate-pulse`}>
                {getIcon()}
              </div>
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <DialogTitle className={`text-center text-2xl font-bold ${
            currentNotification.type === 'reminder'
              ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'
              : 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500'
          } bg-clip-text text-transparent`}>
            {currentNotification.title}
            {(userRole === 'supervisor' || userRole === 'coordinator') && getRoleDisplay() && (
              <span className="block text-sm mt-1 text-muted-foreground">
                {userName} ({getRoleDisplay()})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center space-y-3">
            <p className="text-lg leading-relaxed">
              {currentNotification.message}
            </p>
          </div>

          <Button
            onClick={handleClose}
            className={`w-full ${
              currentNotification.type === 'reminder'
                ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800'
                : 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600'
            }`}
            size="lg"
          >
            {pendingNotifications.length > 1 ? `Got it! (${pendingNotifications.length - 1} more)` : 'Got it!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
