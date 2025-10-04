import { Card } from '@/components/ui/card';
import { LogIn, FileEdit, BarChart } from 'lucide-react';

const steps = [
  {
    icon: LogIn,
    step: '1',
    title: 'Sign In',
    description: 'Create your account as a student, supervisor, coordinator, or admin. Choose your role and get started immediately.',
  },
  {
    icon: FileEdit,
    step: '2',
    title: 'Practice & Record',
    description: 'Students complete practice forms and submit their work. Supervisors provide detailed feedback and assign scores.',
  },
  {
    icon: BarChart,
    step: '3',
    title: 'Review & Export',
    description: 'Coordinators review progress across all students, generate comprehensive reports, and export data for analysis.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, efficient workflow for teaching practice management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent -translate-x-1/2" />
              )}
              
              <Card className="p-6 text-center space-y-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur border-primary/20">
                <div className="relative inline-block">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
