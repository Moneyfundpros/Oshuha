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

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [studentRegNumber, setStudentRegNumber] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const additionalData: any = {};
      
      if (role === 'student') {
        // Format the registration number
        const fullRegNumber = `EBSU/${studentRegNumber}`;
        
        // Validate student registration number - only check database
        const regNumberQuery = query(
          collection(db, 'validRegistrationNumbers'),
          where('registrationNumber', '==', fullRegNumber)
        );
        const regNumberSnapshot = await getDocs(regNumberQuery);
        
        if (regNumberSnapshot.empty) {
          toast({
            title: "Invalid Registration Number",
            description: "This registration number is not authorized. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Validate supervisor ID (students just reference it, don't consume it)
        const supervisorQuery = query(
          collection(db, 'validSupervisorCodes'),
          where('code', '==', supervisorId),
          where('type', '==', 'supervisor')
        );
        const supervisorSnapshot = await getDocs(supervisorQuery);
        
        if (supervisorSnapshot.empty) {
          toast({
            title: "Invalid Supervisor ID",
            description: "This supervisor ID is not valid. Please check and try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Students don't mark supervisor codes as used - multiple students can use same supervisor
        
        additionalData.studentRegNumber = fullRegNumber;
        additionalData.supervisorId = supervisorId;
        additionalData.department = department;
      } else if (role === 'supervisor') {
        // Validate supervisor ID (6 digits)
        if (supervisorId.length !== 6) {
          toast({
            title: "Invalid Supervisor ID",
            description: "Supervisor ID must be 6 digits.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const supervisorQuery = query(
          collection(db, 'validSupervisorCodes'),
          where('code', '==', supervisorId),
          where('type', '==', 'supervisor')
        );
        const supervisorSnapshot = await getDocs(supervisorQuery);

        if (supervisorSnapshot.empty) {
          toast({
            title: "Invalid Supervisor ID",
            description: "This supervisor code is not authorized. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Check if code is already used
        const codeData = supervisorSnapshot.docs[0].data();
        if (codeData.used) {
          toast({
            title: "Code Already Used",
            description: "This supervisor code has already been used. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        additionalData.supervisorId = supervisorId;
        additionalData.codeDocId = supervisorSnapshot.docs[0].id;
      } else if (role === 'coordinator') {
        // Validate coordinator ID (10 digits)
        if (supervisorId.length !== 10) {
          toast({
            title: "Invalid Coordinator ID",
            description: "Coordinator ID must be 10 digits.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const coordinatorQuery = query(
          collection(db, 'validSupervisorCodes'),
          where('code', '==', supervisorId),
          where('type', '==', 'coordinator')
        );
        const coordinatorSnapshot = await getDocs(coordinatorQuery);

        if (coordinatorSnapshot.empty) {
          toast({
            title: "Invalid Coordinator ID",
            description: "This coordinator code is not authorized. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Check if code is already used
        const codeData = coordinatorSnapshot.docs[0].data();
        if (codeData.used) {
          toast({
            title: "Code Already Used",
            description: "This coordinator code has already been used. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        additionalData.coordinatorId = supervisorId;
        additionalData.codeDocId = coordinatorSnapshot.docs[0].id;
      }
      
      await signUp(email, password, name, role, additionalData);

      toast({
        title: "Success!",
        description: "Your account has been created successfully. Redirecting to dashboard...",
      });

      // Wait for auth state to properly update
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
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
          <p className="text-muted-foreground">Create your account</p>
        </div>

        {/* Image Carousel */}
        <ImageCarousel />

        <Card className="p-8 space-y-6 bg-card/50 backdrop-blur border-primary/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {role === 'student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Student Registration Number</Label>
                  <RegistrationInput
                    id="regNumber"
                    value={studentRegNumber}
                    onChange={setStudentRegNumber}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Geography">Geography</SelectItem>
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="Business Administration">Business Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {role === 'supervisor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="supervisorId">Supervisor ID (6 digits)</Label>
                  <Input
                    id="supervisorId"
                    type="text"
                    placeholder="Enter 6-digit supervisor code"
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </>
            )}

            {role === 'coordinator' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="supervisorId">Coordinator ID (10 digits)</Label>
                  <Input
                    id="supervisorId"
                    type="text"
                    placeholder="Enter 10-digit coordinator code"
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
              </>
            )}

            {role === 'student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="supervisorId">Supervisor ID (6 digits)</Label>
                  <Input
                    id="supervisorId"
                    type="text"
                    placeholder="Your supervisor's 6-digit ID"
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Re-enter Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>

          <div className="flex justify-center">
            <GetIDButton />
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
