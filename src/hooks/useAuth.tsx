import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string, role: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string, additionalData?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth state listener');
    let isInitialLoad = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthProvider] Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);

      if (user) {
        (async () => {
          try {
            console.log('[AuthProvider] Fetching user role for:', user.uid);

            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists() && adminDoc.data().role === 'admin') {
              console.log('[AuthProvider] User is admin');
              setUserRole('admin');
            } else {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const role = userDoc.data().role;
                console.log('[AuthProvider] User role:', role);
                setUserRole(role);
              } else {
                console.log('[AuthProvider] No user document found');
                setUserRole(null);
              }
            }
          } catch (error) {
            console.error('[AuthProvider] Error fetching user role:', error);
            setUserRole(null);
          } finally {
            if (isInitialLoad) {
              console.log('[AuthProvider] Initial load complete, setting loading to false');
              setLoading(false);
              isInitialLoad = false;
            }
          }
        })();
      } else {
        console.log('[AuthProvider] No user, setting role to null');
        setUserRole(null);
        if (isInitialLoad) {
          console.log('[AuthProvider] Initial load complete (no user), setting loading to false');
          setLoading(false);
          isInitialLoad = false;
        }
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string, role: string) => {
    console.log('[signIn] Attempting sign in:', { email, role });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[signIn] Firebase auth successful:', result.user.uid);

      if (role === 'admin') {
        console.log('[signIn] Checking admin access');
        const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
        if (adminDoc.exists() && adminDoc.data().role === 'admin') {
          console.log('[signIn] Admin verified');
          setUserRole('admin');
          toast({
            title: "Welcome back, Admin!",
            description: "You've successfully signed in.",
          });
        } else {
          console.log('[signIn] Not an admin, signing out');
          await firebaseSignOut(auth);
          throw new Error('You do not have admin access');
        }
      } else {
        console.log('[signIn] Checking user role');
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;
          console.log('[signIn] User role from DB:', userRole, 'Expected:', role);
          if (userRole === role) {
            console.log('[signIn] Role verified');
            setUserRole(role);
            toast({
              title: "Welcome back!",
              description: "You've successfully signed in.",
            });
          } else {
            console.log('[signIn] Role mismatch, signing out');
            await firebaseSignOut(auth);
            throw new Error(`Invalid role for this account. Expected: ${role}, Found: ${userRole}`);
          }
        } else {
          console.log('[signIn] User document not found');
          await firebaseSignOut(auth);
          throw new Error('User account not found');
        }
      }
      console.log('[signIn] Sign in complete');
    } catch (error: any) {
      console.error('[signIn] Error:', error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string, additionalData?: any) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      const userData: any = {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        ...additionalData,
      };

      const codeDocId = userData.codeDocId;
      delete userData.codeDocId;

      await setDoc(doc(db, 'users', result.user.uid), userData);

      if (codeDocId && (role === 'supervisor' || role === 'coordinator')) {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'validSupervisorCodes', codeDocId), {
          used: true,
          usedBy: email,
          usedAt: new Date().toISOString(),
        });
      }

      toast({
        title: "Account created!",
        description: "Welcome to Practice Portal.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
