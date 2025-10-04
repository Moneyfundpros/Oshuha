import { Card } from '@/components/ui/card';
import classroomImage from '@/assets/classroom-collaboration.jpg';
import digitalToolsImage from '@/assets/digital-tools.jpg';
import innovationImage from '@/assets/innovation-education.jpg';

const educationCards = [
  {
    image: classroomImage,
    title: 'Collaborative Classrooms',
    description: 'Encourage peer review and collaborative lesson planning. Real classroom scenarios sharpen teaching skills and boost confidence through hands-on practice and meaningful feedback.',
  },
  {
    image: digitalToolsImage,
    title: 'Digital Tools & Feedback',
    description: 'Use our intuitive dashboards to track progress, receive instant supervisor feedback, and iterate on teaching methods rapidly. Data-driven insights help you improve continuously.',
  },
  {
    image: innovationImage,
    title: 'Innovation & Upgrade',
    description: 'Continuous improvement through data-driven insights and skill-based milestones helps trainees advance faster. Stay ahead with modern teaching methodologies and best practices.',
  },
];

export function Education() {
  return (
    <section id="education" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Education, Innovation & Growth</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We help trainees grow with practical teaching exercises, structured feedback loops, and measurable progress. Explore features, tools, and success stories below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {educationCards.map((card, index) => (
            <Card 
              key={index} 
              className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur border-primary/20"
            >
              <div className="relative overflow-hidden h-48">
                <img 
                  src={card.image} 
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
