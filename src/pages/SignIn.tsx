import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegistrationInput } from '@/components/ui/registration-input';
import { ImageCarousel } from '@/components/ImageCarousel';
import GetIDButton from '@/components/GetIDButton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GraduationCap, Loader as Loader2 } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SignIn] Form submitted with role:', role);

    if (!role) {
      toast({
        title: "Role required",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let loginEmail = email;

      if (role === 'student' && registrationNumber) {
        console.log('[SignIn] Looking up student by registration number:', registrationNumber);
        const fullRegNumber = registrationNumber.startsWith('EBSU/')
          ? registrationNumber
          : `EBSU/${registrationNumber}`;

        const usersQuery = query(
          collection(db, 'users'),
          where('studentRegNumber', '==', fullRegNumber),
          where('role', '==', 'student')
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
          console.log('[SignIn] Student not found');
          toast({
            title: "Account not found",
            description: "No student account found with this registration number.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        loginEmail = userData.email;
        console.log('[SignIn] Found student email:', loginEmail);
      } else if (role === 'supervisor' && supervisorId) {
        console.log('[SignIn] Looking up supervisor by ID:', supervisorId);
        const usersQuery = query(
          collection(db, 'users'),
          where('supervisorId', '==', supervisorId),
          where('role', '==', 'supervisor')
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
          console.log('[SignIn] Supervisor not found');
          toast({
            title: "Account not found",
            description: "No supervisor account found with this ID.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        loginEmail = userData.email;
        console.log('[SignIn] Found supervisor email:', loginEmail);
      } else if (role === 'coordinator' && supervisorId) {
        console.log('[SignIn] Looking up coordinator by ID:', supervisorId);
        const usersQuery = query(
          collection(db, 'users'),
          where('coordinatorId', '==', supervisorId),
          where('role', '==', 'coordinator')
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
          console.log('[SignIn] Coordinator not found');
          toast({
            title: "Account not found",
            description: "No coordinator account found with this ID.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        loginEmail = userData.email;
        console.log('[SignIn] Found coordinator email:', loginEmail);
      }

      console.log('[SignIn] Calling signIn with:', loginEmail, role);
      await signIn(loginEmail, password, role);
      console.log('[SignIn] signIn completed, navigating to dashboard');

      navigate('/dashboard');
    } catch (error: any) {
      console.error('[SignIn] Error during sign in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <GraduationCap className="h-8 w-8" />
            <span className="text-2xl font-bold">PracticePortal</span>
          </Link>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Image Carousel */}
        <ImageCarousel />

        <Card className="p-8 space-y-6 bg-card/50 backdrop-blur border-primary/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'student' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Student Registration Number</Label>
                  <RegistrationInput
                    id="registrationNumber"
                    value={registrationNumber}
                    onChange={setRegistrationNumber}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </>
            ) : (role === 'supervisor' || role === 'coordinator') ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="supervisorId">
                    {role === 'coordinator' ? 'Coordinator ID (10 digits)' : 'Supervisor ID (6 digits)'}
                  </Label>
                  <Input
                    id="supervisorId"
                    type="text"
                    placeholder={role === 'coordinator' ? 'Enter 10-digit code' : 'Enter 6-digit code'}
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    maxLength={role === 'coordinator' ? 10 : 6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </div>

          <div className="flex justify-center">
            <GetIDButton />
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
