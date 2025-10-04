import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { GraduationCap, ChevronDown, ChevronRight, Star, MessageSquare } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import WelcomeDialog from '@/components/WelcomeDialog';
import { db } from '@/lib/firebase';
import ProfileTab from '@/components/profile/ProfileTab';
import SettingsTab from '@/components/profile/SettingsTab';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationPopup from '@/components/NotificationPopup';
import WelcomeBackDialog from '@/components/WelcomeBackDialog';

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

interface Supervisor {
  id: string;
  name: string;
  email: string;
  supervisorId: string;
  students: Student[];
}

interface Review {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  supervisorId: string;
  supervisorName: string;
  rating: number;
  review: string;
  createdAt: string;
}

export default function CoordinatorDashboard() {
  const { signOut, user } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSupervisor, setExpandedSupervisor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const supervisorUsers = allUsers.filter((u: any) => u.role === 'supervisor');
      const studentUsers = allUsers.filter((u: any) => u.role === 'student') as Student[];

      const supervisorsWithStudents: Supervisor[] = supervisorUsers.map(sup => ({
        id: sup.id,
        name: sup.name,
        email: sup.email,
        supervisorId: sup.supervisorId,
        students: studentUsers.filter(student => student.supervisorId === sup.supervisorId),
      }));

      setSupervisors(supervisorsWithStudents);
      setAllStudents(studentUsers);

      const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupervisor = (supervisorId: string) => {
    setExpandedSupervisor(expandedSupervisor === supervisorId ? null : supervisorId);
  };

  const calculateAverageRating = (supervisorId: string) => {
    const supervisorReviews = reviews.filter(r => r.supervisorId === supervisorId);
    if (supervisorReviews.length === 0) return 0;
    const sum = supervisorReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / supervisorReviews.length).toFixed(1);
  };

  const getScoreStats = () => {
    const scoredStudents = allStudents.filter(s => s.score !== undefined && s.score !== null);
    if (scoredStudents.length === 0) return { average: 0, total: 0 };
    const sum = scoredStudents.reduce((acc, s) => acc + (s.score || 0), 0);
    return {
      average: (sum / scoredStudents.length).toFixed(1),
      total: scoredStudents.length
    };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const scoreStats = getScoreStats();

      <WelcomeDialog />
  return (
    <div>
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
            <h1 className="text-4xl font-bold mb-2">Coordinator Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Supervisors</p>
                <p className="text-3xl font-bold">{supervisors.length}</p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold">{allStudents.length}</p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">{scoreStats.average}/100</p>
                <p className="text-xs text-muted-foreground">{scoreStats.total} students scored</p>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="supervisors" className="w-full">
            <TabsList className="grid w-full grid-cols-5 max-w-4xl">
              <TabsTrigger value="supervisors">Supervisors & Students</TabsTrigger>
              <TabsTrigger value="scores">All Scores</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews & Ratings
                {reviews.length > 0 && <Badge className="ml-2">{reviews.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="supervisors" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Supervisors & Students</h2>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : supervisors.length === 0 ? (
                  <p className="text-muted-foreground">No supervisors found</p>
                ) : (
                  <div className="space-y-4">
                    {supervisors.map((supervisor) => (
                      <Card key={supervisor.id} className="p-4">
                        <Collapsible
                          open={expandedSupervisor === supervisor.id}
                          onOpenChange={() => toggleSupervisor(supervisor.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  {expandedSupervisor === supervisor.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <div>
                                <h3 className="font-semibold text-lg">{supervisor.name}</h3>
                                <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                                <p className="text-xs text-muted-foreground">ID: {supervisor.supervisorId}</p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-sm font-medium">{supervisor.students.length} Students</p>
                              <div className="flex items-center gap-2 justify-end">
                                {renderStars(Number(calculateAverageRating(supervisor.supervisorId)))}
                                <span className="text-sm text-muted-foreground">
                                  ({calculateAverageRating(supervisor.supervisorId)})
                                </span>
                              </div>
                            </div>
                          </div>

                          <CollapsibleContent className="mt-4">
                            {supervisor.students.length === 0 ? (
                              <p className="text-sm text-muted-foreground ml-12">No students assigned yet</p>
                            ) : (
                              <div className="ml-12">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Reg Number</TableHead>
                                      <TableHead>Department</TableHead>
                                      <TableHead>School</TableHead>
                                      <TableHead>Score</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {supervisor.students.map((student) => (
                                      <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell className="font-mono text-sm">{student.studentRegNumber}</TableCell>
                                        <TableCell>{student.department}</TableCell>
                                        <TableCell>
                                          {student.teachingPracticeSchool || (
                                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                                              Not Set
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {student.score !== undefined && student.score !== null ? (
                                            <span className="font-semibold">{student.score}/100</span>
                                          ) : (
                                            <span className="text-muted-foreground text-sm">Not scored</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="scores" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">All Student Scores</h2>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Reg Number</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Supervisor</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStudents.map((student) => {
                        const supervisor = supervisors.find(s => s.supervisorId === student.supervisorId);
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="font-mono text-sm">{student.studentRegNumber}</TableCell>
                            <TableCell>{student.department}</TableCell>
                            <TableCell>{supervisor?.name || 'Not assigned'}</TableCell>
                            <TableCell>
                              {student.teachingPracticeSchool || (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  Not Set
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.score !== undefined && student.score !== null ? (
                                <Badge
                                  variant="outline"
                                  className={
                                    student.score >= 90
                                      ? 'bg-green-100 text-green-800 border-green-800'
                                      : student.score >= 70
                                      ? 'bg-blue-100 text-blue-800 border-blue-800'
                                      : student.score >= 60
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-800'
                                      : 'bg-red-100 text-red-800 border-red-800'
                                  }
                                >
                                  {student.score}/100
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not scored</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Supervisor Reviews & Ratings</h2>
                </div>

                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews submitted yet</p>
                ) : (
                  <div className="space-y-6">
                    {supervisors.map((supervisor) => {
                      const supervisorReviews = reviews.filter(
                        r => r.supervisorId === supervisor.supervisorId
                      );

                      if (supervisorReviews.length === 0) return null;

                      return (
                        <Card key={supervisor.id} className="p-6 border-2">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-semibold">{supervisor.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Supervisor ID: {supervisor.supervisorId}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  {renderStars(Number(calculateAverageRating(supervisor.supervisorId)))}
                                </div>
                                <p className="text-2xl font-bold">
                                  {calculateAverageRating(supervisor.supervisorId)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {supervisorReviews.length} review{supervisorReviews.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                              {supervisorReviews.map((review) => (
                                <Card key={review.id} className="p-4 bg-muted/50">
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="font-medium">{review.studentName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {review.studentRegNumber}
                                        </p>
                                      </div>
                                      {renderStars(review.rating)}
                                    </div>
                                    {review.review && (
                                      <p className="text-sm text-muted-foreground italic">
                                        "{review.review}"
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
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
    </div>
  );
}
