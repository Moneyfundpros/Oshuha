import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegistrationInput } from '@/components/ui/registration-input';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  query, 
  where,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GraduationCap, Loader2, Users, Settings, Shield, Trash2, Copy, Plus, Ban, Eye, CheckCircle, XCircle } from 'lucide-react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  studentRegNumber?: string;
  supervisorId?: string;
  department?: string;
  suspended?: boolean;
}

interface ValidCode {
  id: string;
  code: string;
  type: 'coordinator' | 'supervisor';
  createdAt: string;
  used?: boolean;
  usedBy?: string;
  usedAt?: string;
}

interface ValidRegNumber {
  id: string;
  registrationNumber: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [validCodes, setValidCodes] = useState<ValidCode[]>([]);
  const [validRegNumbers, setValidRegNumbers] = useState<ValidRegNumber[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [newRegNumber, setNewRegNumber] = useState('');
  const [selectedCodeDetails, setSelectedCodeDetails] = useState<ValidCode | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || userRole === null) {
        navigate('/admin-login');
      } else if (userRole !== 'admin') {
        navigate('/signin');
      }
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      loadData();
    }
  }, [user, userRole]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);

      // Load valid codes
      const codesSnapshot = await getDocs(collection(db, 'validSupervisorCodes'));
      const codesData = codesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ValidCode));
      setValidCodes(codesData);

      // Load valid registration numbers
      const regNumbersSnapshot = await getDocs(collection(db, 'validRegistrationNumbers'));
      const regNumbersData = regNumbersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ValidRegNumber));
      setValidRegNumbers(regNumbersData);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load admin panel data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const generateCode = (length: number): string => {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  };

  const generateUniqueCode = async (type: 'coordinator' | 'supervisor'): Promise<string> => {
    const length = type === 'coordinator' ? 10 : 6;
    let code = generateCode(length);
    
    // Check if code already exists
    const q = query(
      collection(db, 'validSupervisorCodes'),
      where('code', '==', code)
    );
    const snapshot = await getDocs(q);
    
    // If code exists, generate a new one recursively
    if (!snapshot.empty) {
      return generateUniqueCode(type);
    }
    
    return code;
  };

  const handleGenerateCode = async (type: 'coordinator' | 'supervisor') => {
    try {
      const code = await generateUniqueCode(type);
      
      await addDoc(collection(db, 'validSupervisorCodes'), {
        code,
        type,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Code generated successfully",
        description: `${type === 'coordinator' ? '10-digit Coordinator' : '6-digit Supervisor'} code: ${code}`,
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error generating code",
        description: "Failed to generate code",
        variant: "destructive",
      });
    }
  };

  const handleAddRegNumber = async () => {
    if (!newRegNumber || newRegNumber.length < 9 || newRegNumber.length > 13) {
      toast({
        title: "Invalid registration number",
        description: "Please enter a complete registration number (5-9 digits after first 4 digits)",
        variant: "destructive",
      });
      return;
    }

    const fullRegNumber = `EBSU/${newRegNumber}`;

    try {
      // Check if already exists
      const q = query(
        collection(db, 'validRegistrationNumbers'),
        where('registrationNumber', '==', fullRegNumber)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        toast({
          title: "Registration number already exists",
          description: "This registration number is already in the system",
          variant: "destructive",
        });
        return;
      }

      await addDoc(collection(db, 'validRegistrationNumbers'), {
        registrationNumber: fullRegNumber,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Registration number added",
        description: `${fullRegNumber} has been added successfully`,
      });

      setNewRegNumber('');
      loadData();
    } catch (error) {
      toast({
        title: "Error adding registration number",
        description: "Failed to add registration number",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      // If student, delete their registration number and mark code as unused
      if (userToDelete?.role === 'student') {
        if (userToDelete.studentRegNumber) {
          const regQuery = query(
            collection(db, 'validRegistrationNumbers'),
            where('registrationNumber', '==', userToDelete.studentRegNumber)
          );
          const regSnapshot = await getDocs(regQuery);
          regSnapshot.docs.forEach(async (docSnap) => {
            await deleteDoc(docSnap.ref);
          });
        }
        
        if (userToDelete.supervisorId) {
          const codeQuery = query(
            collection(db, 'validSupervisorCodes'),
            where('code', '==', userToDelete.supervisorId)
          );
          const codeSnapshot = await getDocs(codeQuery);
          const { updateDoc } = await import('firebase/firestore');
          codeSnapshot.docs.forEach(async (docSnap) => {
            await updateDoc(docSnap.ref, {
              used: false,
              usedBy: null,
              usedAt: null,
            });
          });
        }
      }
      
      // If supervisor, delete their code
      if (userToDelete?.role === 'supervisor' && userToDelete.supervisorId) {
        const codeQuery = query(
          collection(db, 'validSupervisorCodes'),
          where('code', '==', userToDelete.supervisorId)
        );
        const codeSnapshot = await getDocs(codeQuery);
        codeSnapshot.docs.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
      }
      
      toast({
        title: "User deleted",
        description: "User and all associated data have been successfully removed",
      });
      loadData();
      setDeleteUserId(null);
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      const currentStatus = userSnapshot.data()?.suspended || false;
      
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(userDoc, {
        suspended: !currentStatus,
        suspendedAt: !currentStatus ? new Date().toISOString() : null,
      });
      
      toast({
        title: currentStatus ? "User activated" : "User suspended",
        description: currentStatus ? "User has been reactivated" : "User has been suspended",
      });
      loadData();
      setSuspendUserId(null);
    } catch (error) {
      toast({
        title: "Error updating user status",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
    });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">PracticePortal</span>
            <Shield className="h-5 w-5 text-primary ml-2" />
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users, codes, and registration numbers</p>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="codes">Access Codes</TabsTrigger>
              <TabsTrigger value="registrations">Registration Numbers</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                {users.length === 0 ? (
                  <p className="text-muted-foreground">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell>
                            {user.suspended ? (
                              <span className="text-red-500 font-semibold">Suspended</span>
                            ) : (
                              <span className="text-green-500 font-semibold">Active</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant={user.suspended ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteUserId(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="codes" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Generate Coordinator Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a unique 10-digit code for coordinators
                  </p>
                  <Button onClick={() => handleGenerateCode('coordinator')} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate 10-Digit Code
                  </Button>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Generate Supervisor Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a unique 6-digit code for supervisors
                  </p>
                  <Button onClick={() => handleGenerateCode('supervisor')} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate 6-Digit Code
                  </Button>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Available Codes
                  </h3>
                  {validCodes.filter(code => !code.used).length === 0 ? (
                    <p className="text-muted-foreground">No available codes</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validCodes.filter(code => !code.used).map((code) => (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                            <TableCell className="capitalize">{code.type}</TableCell>
                            <TableCell>
                              <span className="text-red-500 font-semibold flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                Not Used
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(code.code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Used Codes
                  </h3>
                  {validCodes.filter(code => code.used).length === 0 ? (
                    <p className="text-muted-foreground">No used codes yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validCodes.filter(code => code.used).map((code) => (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                            <TableCell className="capitalize">{code.type}</TableCell>
                            <TableCell>
                              <span className="text-green-500 font-semibold flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Used
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCodeDetails(code)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(code.code)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="registrations" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Add Student Registration Number</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newRegNumber">Registration Number</Label>
                    <RegistrationInput
                      id="newRegNumber"
                      value={newRegNumber}
                      onChange={setNewRegNumber}
                    />
                  </div>
                  <Button onClick={handleAddRegNumber} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Registration Number
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Valid Registration Numbers</h3>
                {validRegNumbers.length === 0 ? (
                  <p className="text-muted-foreground">No registration numbers added yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration Number</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validRegNumbers.map((regNum) => (
                        <TableRow key={regNum.id}>
                          <TableCell className="font-mono font-semibold">
                            {regNum.registrationNumber}
                          </TableCell>
                          <TableCell>
                            {new Date(regNum.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data including codes and registration numbers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!selectedCodeDetails} onOpenChange={() => setSelectedCodeDetails(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Code Usage Details</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-4">
                <p><strong>Code:</strong> {selectedCodeDetails?.code}</p>
                <p><strong>Type:</strong> <span className="capitalize">{selectedCodeDetails?.type}</span></p>
                <p><strong>Used By:</strong> {selectedCodeDetails?.usedBy}</p>
                <p><strong>Used At:</strong> {selectedCodeDetails?.usedAt ? new Date(selectedCodeDetails.usedAt).toLocaleString() : 'N/A'}</p>
                <p><strong>Created At:</strong> {selectedCodeDetails?.createdAt ? new Date(selectedCodeDetails.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
