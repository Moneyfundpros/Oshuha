import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, FileText, Calendar, User, Award, School, Star, Download, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import ProfileTab from '@/components/profile/ProfileTab';
import SettingsTab from '@/components/profile/SettingsTab';
import WelcomeDialog from '@/components/WelcomeDialog';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationPopup from '@/components/NotificationPopup';
import WelcomeBackDialog from '@/components/WelcomeBackDialog';
import jsPDF from 'jspdf';

export default function StudentDashboard() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<any>(null);
  const [supervisorData, setSupervisorData] = useState<any>(null);
  const [teachingSchool, setTeachingSchool] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [hasReviewed, setHasReviewed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadStudentData();
      subscribeToNotifications();
    }
  }, [user]);

  const subscribeToNotifications = () => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);

      notifs.forEach(notif => {
        if (!shownNotifications.has(notif.id)) {
          toast({
            title: notif.title,
            description: notif.message,
          });
          setShownNotifications(prev => new Set(prev).add(notif.id));
        }
      });
    });

    return unsubscribe;
  };

  const loadStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'users', user!.uid));
      const data = studentDoc.data();

      if (data) {
        setStudentData(data);
        setTeachingSchool(data.teachingPracticeSchool || '');

        const shouldShowCongrats = data.score !== undefined &&
                                   data.score !== null &&
                                   !localStorage.getItem(`congrats_shown_${user!.uid}_${data.score}`);

        if (shouldShowCongrats) {
          setShowCongrats(true);
        }

        if (data.supervisorId) {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const supervisor = usersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .find((u: any) => u.role === 'supervisor' && u.supervisorId === data.supervisorId);

          if (supervisor) {
            setSupervisorData(supervisor);
          }
        }

        const reviewsSnapshot = await getDocs(
          query(collection(db, 'reviews'), where('studentId', '==', user!.uid))
        );
        setHasReviewed(reviewsSnapshot.docs.length > 0);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchool = async () => {
    if (!teachingSchool.trim()) {
      toast({
        title: "Error",
        description: "Please enter a teaching practice school",
        variant: "destructive",
      });
      return;
    }

    try {
      if (studentData?.teachingPracticeSchool && studentData.teachingPracticeSchool !== teachingSchool) {
        await addDoc(collection(db, 'schoolChangeApprovals'), {
          studentId: user!.uid,
          studentName: studentData.name,
          studentRegNumber: studentData.studentRegNumber,
          oldSchool: studentData.teachingPracticeSchool,
          newSchool: teachingSchool,
          supervisorId: studentData.supervisorId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        if (supervisorData) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: supervisorData.id,
            title: 'School Change Request',
            message: `${studentData.name} (${studentData.studentRegNumber}) has requested to change their teaching practice school from "${studentData.teachingPracticeSchool}" to "${teachingSchool}"`,
            type: 'approval',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }

        toast({
          title: "Approval Request Sent",
          description: "Your supervisor will review your school change request",
        });
        setIsEditing(false);
      } else {
        await updateDoc(doc(db, 'users', user!.uid), {
          teachingPracticeSchool: teachingSchool,
        });

        toast({
          title: "Success",
          description: "Teaching practice school saved successfully",
        });
        setIsEditing(false);
        loadStudentData();
      }
    } catch (error) {
      console.error('Error saving school:', error);
      toast({
        title: "Error",
        description: "Failed to save teaching practice school",
        variant: "destructive",
      });
    }
  };

  const handleCongratsClose = () => {
    localStorage.setItem(`congrats_shown_${user!.uid}_${studentData.score}`, 'true');
    setShowCongrats(false);
    if (!hasReviewed && studentData.score !== undefined) {
      setShowReviewDialog(true);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a star rating",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        studentId: user!.uid,
        studentName: studentData.name,
        studentRegNumber: studentData.studentRegNumber,
        supervisorId: studentData.supervisorId,
        supervisorName: supervisorData?.name || 'Unknown',
        rating,
        review: reviewText,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Thank you!",
        description: "Your review has been submitted successfully",
      });
      setShowReviewDialog(false);
      setHasReviewed(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResult = () => {
    const pdf = new jsPDF();

    pdf.setFillColor(0, 51, 102);
    pdf.rect(0, 0, 210, 297, 'F');

    pdf.setFillColor(255, 255, 255);
    pdf.rect(10, 10, 190, 277, 'F');

    pdf.setDrawColor(0, 51, 102);
    pdf.setLineWidth(2);
    pdf.rect(15, 15, 180, 267);

    pdf.setFontSize(24);
    pdf.setTextColor(0, 51, 102);
    pdf.text('TEACHING PRACTICE RESULT', 105, 40, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Official Certificate', 105, 50, { align: 'center' });

    pdf.setDrawColor(0, 51, 102);
    pdf.line(20, 55, 190, 55);

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    pdf.text('Student Name:', 25, 75);
    pdf.setFont('helvetica', 'bold');
    pdf.text(studentData.name, 25, 82);

    pdf.setFont('helvetica', 'normal');
    pdf.text('Registration Number:', 25, 95);
    pdf.setFont('helvetica', 'bold');
    pdf.text(studentData.studentRegNumber, 25, 102);

    pdf.setFont('helvetica', 'normal');
    pdf.text('Department:', 25, 115);
    pdf.setFont('helvetica', 'bold');
    pdf.text(studentData.department, 25, 122);

    pdf.setFont('helvetica', 'normal');
    pdf.text('Teaching Practice School:', 25, 135);
    pdf.setFont('helvetica', 'bold');
    pdf.text(studentData.teachingPracticeSchool || 'N/A', 25, 142);

    pdf.setFont('helvetica', 'normal');
    pdf.text('Supervisor Name:', 25, 155);
    pdf.setFont('helvetica', 'bold');
    pdf.text(supervisorData?.name || 'N/A', 25, 162);

    pdf.setFont('helvetica', 'normal');
    pdf.text('Supervisor ID:', 25, 175);
    pdf.setFont('helvetica', 'bold');
    pdf.text(supervisorData?.supervisorId || 'N/A', 25, 182);

    pdf.setFillColor(230, 245, 255);
    pdf.rect(20, 195, 170, 30, 'F');
    pdf.setDrawColor(0, 51, 102);
    pdf.rect(20, 195, 170, 30);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Final Score', 105, 207, { align: 'center' });

    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${studentData.score}/100`, 105, 218, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is an official document from PracticePortal', 105, 260, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 267, { align: 'center' });

    pdf.save(`Teaching-Practice-Result-${studentData.studentRegNumber}.pdf`);
  };

  const getCongratsQuote = (score: number) => {
    if (score >= 90) return "Excellence is not a skill, it's an attitude. Outstanding work!";
    if (score >= 80) return "Great job! Your dedication and hard work are truly commendable.";
    if (score >= 70) return "Well done! You've shown great commitment to your teaching practice.";
    if (score >= 60) return "Good effort! Keep working hard and you'll continue to improve.";
    return "You've completed your teaching practice. Keep learning and growing!";
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="print:hidden">
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
            <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {studentData?.name}</p>
          </div>

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <School className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Teaching Practice School</h2>
            </div>

            {!studentData?.teachingPracticeSchool || isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="school">School Name</Label>
                  <Input
                    id="school"
                    value={teachingSchool}
                    onChange={(e) => setTeachingSchool(e.target.value)}
                    placeholder="Enter your teaching practice school name"
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSchool}>Save</Button>
                  {studentData?.teachingPracticeSchool && (
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setTeachingSchool(studentData.teachingPracticeSchool);
                    }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg font-medium">{studentData.teachingPracticeSchool}</p>
                </div>
                <Button onClick={() => setIsEditing(true)}>Edit School</Button>
              </div>
            )}
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">My Reports</h3>
                  <p className="text-sm text-muted-foreground">View and submit</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Schedule</h3>
                  <p className="text-sm text-muted-foreground">View sessions</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">My Supervisor</h3>
                  <p className="text-sm text-muted-foreground">
                    {supervisorData?.name || 'Not assigned'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Award className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Your Score</h3>
                  <p className="text-sm text-muted-foreground">
                    {studentData?.score !== undefined && studentData?.score !== null ? `${studentData.score}/100` : 'Not scored yet'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {studentData?.score !== undefined && studentData?.score !== null && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Your Result is Ready!</h3>
                  <p className="text-muted-foreground">Download your teaching practice result certificate</p>
                </div>
                <Button onClick={handleDownloadResult} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Download Result
                </Button>
              </div>
            </Card>
          )}
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

      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Congratulations {studentData?.name}!</h2>
            <p className="text-lg text-muted-foreground italic">
              {getCongratsQuote(studentData?.score || 0)}
            </p>
            <div className="text-5xl font-bold text-primary">
              {studentData?.score}/100
            </div>
            <Button onClick={handleCongratsClose} size="lg" className="w-full">
              Gotcha!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Supervisor</DialogTitle>
            <DialogDescription>
              Share your experience with {supervisorData?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="review">Your Review (Optional)</Label>
              <Textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about your supervisor..."
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} className="flex-1">
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {studentData?.score !== undefined && studentData?.score !== null && (
        <div className="hidden print:block">
          <div className="max-w-4xl mx-auto p-12 bg-white">
            <div className="border-8 border-double border-blue-900 p-8">
              <div className="text-center space-y-6">
                <div className="border-b-4 border-blue-900 pb-6">
                  <h1 className="text-4xl font-bold text-blue-900 mb-2">TEACHING PRACTICE RESULT</h1>
                  <p className="text-lg text-gray-600">Official Certificate</p>
                </div>

                <div className="space-y-8 py-8">
                  <div className="grid grid-cols-2 gap-8 text-left">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Student Name</p>
                      <p className="text-xl font-semibold border-b-2 border-gray-300 pb-2">{studentData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                      <p className="text-xl font-semibold border-b-2 border-gray-300 pb-2">{studentData.studentRegNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Teaching Practice School</p>
                      <p className="text-xl font-semibold border-b-2 border-gray-300 pb-2">{studentData.teachingPracticeSchool || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Department</p>
                      <p className="text-xl font-semibold border-b-2 border-gray-300 pb-2">{studentData.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Supervisor Name</p>
                      <p className="text-xl font-semibold border-b-2 border-gray-300 pb-2">{supervisorData?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Supervisor ID</p>
                      <p className="text-xl font-semibold border-b-2 border-gray-300 pb-2">{supervisorData?.supervisorId || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-900">
                    <p className="text-sm text-gray-600 mb-2">Final Score</p>
                    <p className="text-5xl font-bold text-blue-900">{studentData.score}/100</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-12 mt-12 border-t-2 border-gray-300">
                  <div className="text-center">
                    <div className="border-t-2 border-black pt-2 mt-16">
                      <p className="text-sm font-medium">Official Stamp</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-black pt-2 mt-16">
                      <p className="text-sm font-medium">Student Signature</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-black pt-2 mt-16">
                      <p className="text-sm font-medium">Supervisor Signature</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 pt-6">
                  <p>This is an official document from PracticePortal</p>
                  <p>Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
