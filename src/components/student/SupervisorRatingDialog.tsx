import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface SupervisorRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supervisorId: string;
  supervisorName: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
}

export default function SupervisorRatingDialog({
  isOpen,
  onClose,
  supervisorId,
  supervisorName,
  studentId,
  studentName,
  studentRegNumber,
}: SupervisorRatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating for your supervisor",
        variant: "destructive",
      });
      return;
    }

    if (!review.trim()) {
      toast({
        title: "Review required",
        description: "Please write a review about your supervisor",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supervisorReviews'), {
        supervisorId,
        supervisorName,
        studentId,
        studentName,
        studentRegNumber,
        rating,
        review: review.trim(),
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Review submitted",
        description: "Thank you for rating your supervisor!",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Supervisor</DialogTitle>
          <DialogDescription>
            Please share your experience with {supervisorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating} out of 5 stars
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="review">
              Your Review
            </label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about your supervisor's guidance and support..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
