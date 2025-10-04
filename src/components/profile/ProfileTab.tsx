import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Upload, Save, User as UserIcon } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  photoURL?: string;
  studentRegNumber?: string;
  coordinatorId?: string;
  supervisorId?: string;
  role?: string;
}

export default function ProfileTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setEditedName(data.name || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `profile-pictures/${user.uid}_${timestamp}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: photoURL,
      });

      setUserData(prev => prev ? { ...prev, photoURL } : null);

      await loadUserData();

      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      });

      await loadUserData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleNameUpdate = async () => {
    if (!user || !editedName.trim()) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editedName.trim(),
      });

      setUserData(prev => prev ? { ...prev, name: editedName.trim() } : null);
      setIsEditing(false);

      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: "Update failed",
        description: "Failed to update name",
        variant: "destructive",
      });
    }
  };

  const getUserIdentifier = () => {
    if (userData?.studentRegNumber) return userData.studentRegNumber;
    if (userData?.coordinatorId) return userData.coordinatorId;
    if (userData?.supervisorId) return userData.supervisorId;
    return 'N/A';
  };

  const getIdentifierLabel = () => {
    if (userData?.studentRegNumber) return 'Registration Number';
    if (userData?.coordinatorId) return 'Coordinator ID';
    if (userData?.supervisorId) return 'Supervisor ID';
    return 'User ID';
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  const initials = userData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Profile</h2>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage
              src={userData?.photoURL}
              alt={userData?.name}
              key={userData?.photoURL}
            />
            <AvatarFallback className="text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-center gap-2">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </div>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">Max 5MB, JPG or PNG</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            {isEditing ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your name"
                />
                <Button onClick={handleNameUpdate} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => {
                  setIsEditing(false);
                  setEditedName(userData?.name || '');
                }} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <p className="text-lg font-medium">{userData?.name}</p>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground">{getIdentifierLabel()}</Label>
            <p className="text-lg font-mono mt-2">{getUserIdentifier()}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-lg mt-2">{userData?.email}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Role</Label>
            <p className="text-lg mt-2 capitalize">{userData?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
