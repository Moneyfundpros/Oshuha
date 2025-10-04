import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Trash2, LogOut } from 'lucide-react';

export default function SettingsTab() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordChange = async () => {
    if (!user || !auth.currentUser || !auth.currentUser.email) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = "Failed to change password";

      if (error.code === 'auth/wrong-password') {
        errorMessage = "Current password is incorrect";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Please sign out and sign in again before changing your password";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser || !auth.currentUser.email) return;

    setIsDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        deleteConfirmPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(auth.currentUser);

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      let errorMessage = "Failed to delete account";

      if (error.code === 'auth/wrong-password') {
        errorMessage = "Password is incorrect";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Please sign out and sign in again before deleting your account";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmPassword('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Change Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <LogOut className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Sign Out</h2>
        </div>

        <p className="text-muted-foreground mb-4">
          Sign out of your account on this device
        </p>

        <Button onClick={handleSignOut} variant="outline" className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </Card>

      <Card className="p-6 border-destructive">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="h-6 w-6 text-destructive" />
          <h2 className="text-2xl font-semibold text-destructive">Delete Account</h2>
        </div>

        <p className="text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4">
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <Input
                id="delete-password"
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmPassword('')}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deleteConfirmPassword}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
