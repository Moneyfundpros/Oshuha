import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileTab from '@/components/profile/ProfileTab';
import SettingsTab from '@/components/profile/SettingsTab';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationPopup from '@/components/NotificationPopup';
import WelcomeBackDialog from '@/components/WelcomeBackDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import WelcomeDialog from '@/components/WelcomeDialog';
import { GraduationCap, Eye, Send, Bell, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  email: string;
  studentRegNumber: string;
  department: string;
  supervisorId: string;
  teachingPracticeSchool?: string;
  score?: number;
}

interface Approval {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  oldSchool: string;
  newSchool: string;
  status: string;
  createdAt: string;
}

export default function SupervisorDashboard() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [score, setScore] = useState('');

  useEffect(() => {
    if (user) {
      loadStudents();
      subscribeToApprovals();
    }
  }, [user]);

  const subscribeToApprovals = () => {
    if (!user) return;

    getDoc(doc(db, 'users', user.uid)).then(userDoc => {
      const supervisorId = userDoc.data()?.supervisorId;
      if (!supervisorId) return;

      const q = query(
        collection(db, 'schoolChangeApprovals'),
        where('supervisorId', '==', supervisorId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const approvalsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Approval[];
        setApprovals(approvalsData);
      });

      return unsubscribe;
    });
  };

  const loadStudents = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      const supervisorId = userDoc.data()?.supervisorId;

      if (!supervisorId) {
        setLoading(false);
        return;
      }

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allStudents = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

      const filteredStudents = allStudents.filter((u: any) => u.role === 'student' && u.supervisorId === supervisorId) as Student[];

      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setScore(student.score?.toString() || '');
  };

  const handleScoreSubmit = async () => {
    if (!selectedStudent) return;

    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      toast({
        title: "Invalid score",
        description: "Please enter a score between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'users', selectedStudent.id), {
        score: scoreValue,
      });

      toast({
        title: "Score updated",
        description: `Score for ${selectedStudent.name} has been updated`,
      });

      setSelectedStudent(null);
      loadStudents();
    } catch (error) {
      toast({
        title: "Error updating score",
        description: "Failed to update student score",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async (student: Student) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId: student.id,
        title: 'Reminder: Teaching Practice School',
        message: `Please input your teaching practice school in your dashboard.`,
        type: 'reminder',
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Reminder sent",
        description: `Notification sent to ${student.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (approval: Approval, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'schoolChangeApprovals', approval.id), {
        status: approved ? 'approved' : 'rejected',
        reviewedAt: new Date().toISOString(),
      });

      if (approved) {
        await updateDoc(doc(db, 'users', approval.studentId), {
          teachingPracticeSchool: approval.newSchool,
        });
      }

      await addDoc(collection(db, 'notifications'), {
        recipientId: approval.studentId,
        title: approved ? 'School Change Approved' : 'School Change Rejected',
        message: approved
          ? `Your request to change teaching practice school to "${approval.newSchool}" has been approved.`
          : `Your request to change teaching practice school has been rejected.`,
        type: 'approval_result',
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: approved ? "Approved" : "Rejected",
        description: `School change request ${approved ? 'approved' : 'rejected'}`,
      });

      loadStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <WelcomeDialog />
      <WelcomeBackDialog />
      <NotificationPopup />
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">PracticePortal</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Supervisor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>

          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="students">My Students</TabsTrigger>
              <TabsTrigger value="approvals">
                Approvals {approvals.length > 0 && <Badge className="ml-2">{approvals.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">My Students</h2>
                  <div className="text-sm text-muted-foreground">
                    Total: {students.length} students
                  </div>
                </div>

                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : students.length === 0 ? (
                  <p className="text-muted-foreground">No students assigned yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Reg Number</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="font-mono text-sm">{student.studentRegNumber}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>
                            {student.teachingPracticeSchool ? (
                              <span className="text-sm">{student.teachingPracticeSchool}</span>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Not Set
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.score !== undefined ? (
                              <span className="font-semibold">{student.score}/100</span>
                            ) : (
                              <span className="text-muted-foreground">Not scored</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewStudent(student)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View & Score
                              </Button>
                              {!student.teachingPracticeSchool && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendReminder(student)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Remind
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Pending School Change Approvals</h2>
                </div>

                {approvals.length === 0 ? (
                  <p className="text-muted-foreground">No pending approvals</p>
                ) : (
                  <div className="space-y-4">
                    {approvals.map((approval) => (
                      <Card key={approval.id} className="p-4 border-2">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{approval.studentName}</h3>
                              <p className="text-sm text-muted-foreground">
                                Reg No: {approval.studentRegNumber}
                              </p>
                            </div>
                            <Badge>Pending</Badge>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Current School:</p>
                              <p className="font-medium">{approval.oldSchool}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Requested Change To:</p>
                              <p className="font-medium text-primary">{approval.newSchool}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleApproval(approval, true)}
                              className="flex-1 gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleApproval(approval, false)}
                              variant="destructive"
                              className="flex-1 gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>View and score student performance</DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{selectedStudent.name}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedStudent.email}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Registration Number</Label>
                <p className="font-mono">{selectedStudent.studentRegNumber}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Department</Label>
                <p className="font-medium">{selectedStudent.department}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Teaching Practice School</Label>
                <p className="font-medium">{selectedStudent.teachingPracticeSchool || 'Not specified'}</p>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="score">Score (0-100)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter score"
                  />
                  <Button onClick={handleScoreSubmit}>
                    Save Score
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
