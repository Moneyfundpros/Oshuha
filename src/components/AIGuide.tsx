import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegistrationInput } from '@/components/ui/registration-input';
import { Card } from '@/components/ui/card';
import { Bot, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 'welcome' | 'role-select' | 'reg-number' | 'final';
type Role = 'student' | 'coordinator' | 'supervisor' | null;

interface AIGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AIGuide({ open, onOpenChange }: AIGuideProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('welcome');
  const [role, setRole] = useState<Role>(null);
  const [regNumber, setRegNumber] = useState('');

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetChat();
      }, 300);
    }
  }, [open]);

  const resetChat = () => {
    setStep('welcome');
    setRole(null);
    setRegNumber('');
  };

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole as Role);
    if (selectedRole === 'student') {
      setStep('reg-number');
    } else {
      setStep('final');
    }
  };

  const handleRegNumberSubmit = () => {
    if (!regNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your registration number",
        variant: "destructive",
      });
      return;
    }
    setStep('final');
  };

  const generateWhatsAppLink = () => {
    let message = '';

    if (role === 'student' && regNumber) {
      const fullRegNumber = regNumber.startsWith('EBSU/') ? regNumber : `EBSU/${regNumber}`;
      message = `I want to register my registration number\n\n${fullRegNumber}`;
    } else if (role === 'coordinator') {
      message = 'I need a coordinator ID for my coordinator role';
    } else if (role === 'supervisor') {
      message = 'I need a supervisor ID for my supervisor role';
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/2349036053739?text=${encodedMessage}`;
  };

  const handleContactAdmin = () => {
    window.open(generateWhatsAppLink(), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MessageCircle className="h-6 w-6 text-primary" />
            Account Setup Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'welcome' && (
            <Card className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Welcome! I'm here to help you get started.
              </h3>
              <p className="text-center text-muted-foreground">
                I'll guide you through the process of getting your ID or registration number to create an account.
              </p>
              <Button onClick={() => setStep('role-select')} className="w-full" size="lg">
                Get Started
              </Button>
            </Card>
          )}

          {step === 'role-select' && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">What's your role?</h3>
              <p className="text-sm text-muted-foreground">
                Select your role to proceed with the registration process.
              </p>
              <div className="space-y-2">
                <Label htmlFor="role-select">Select Role</Label>
                <Select onValueChange={handleRoleSelect}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          )}

          {step === 'reg-number' && role === 'student' && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Enter Your Registration Number</h3>
              <p className="text-sm text-muted-foreground">
                Please provide your student registration number.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reg-number">Registration Number</Label>
                <RegistrationInput
                  id="reg-number"
                  value={regNumber}
                  onChange={setRegNumber}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRegNumberSubmit} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Continue
                </Button>
                <Button variant="outline" onClick={() => setStep('role-select')}>
                  Back
                </Button>
              </div>
            </Card>
          )}

          {step === 'final' && (
            <Card className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
                  <MessageCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center">Ready to Contact Admin!</h3>
              <p className="text-sm text-muted-foreground text-center">
                {role === 'student'
                  ? `Click below to send your registration number (${regNumber}) to the admin via WhatsApp.`
                  : `Click below to request your ${role} ID from the admin via WhatsApp.`}
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Your message will be:</p>
                <p className="text-sm italic">
                  {role === 'student' && regNumber
                    ? `"I want to register my registration number\n\n${regNumber.startsWith('EBSU/') ? regNumber : `EBSU/${regNumber}`}"`
                    : role === 'coordinator'
                    ? '"I need a coordinator ID for my coordinator role"'
                    : '"I need a supervisor ID for my supervisor role"'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleContactAdmin} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  Open WhatsApp
                </Button>
                <Button variant="outline" onClick={resetChat}>
                  Start Over
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
