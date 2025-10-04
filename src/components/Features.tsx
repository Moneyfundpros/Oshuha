import { Card } from '@/components/ui/card';
import { ClipboardCheck, Users, MapPin, BarChart3, Calendar, Shield } from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Score Collection',
    description: 'Students\' practice scores saved and visible to supervisors and coordinators with real-time updates.',
  },
  {
    icon: Users,
    title: 'Role-based Access',
    description: 'Separate secure flows for Students, Supervisors, Coordinators, and Admins with granular permissions.',
  },
  {
    icon: MapPin,
    title: 'Practice Locations',
    description: 'Record where the practice happened — school, classroom, or virtual sessions with detailed tracking.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Visualize growth over time with comprehensive charts and performance metrics.',
  },
  {
    icon: Calendar,
    title: 'Scheduling System',
    description: 'Plan and manage teaching practice sessions with integrated calendar and reminders.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade security ensures your data is protected with encrypted storage.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage teaching practice effectively
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
