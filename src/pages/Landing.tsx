import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Award } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
const Landing = () => {
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" style={{
      backgroundImage: `url(${heroBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
        <div className="absolute inset-0 bg-background/80" />
        
        <div className="container relative z-10 px-4 py-20">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-6xl md:text-[4.5rem] font-extrabold mb-6 text-foreground leading-tight tracking-tighter text-center">
            INTERVUZA<br className="hidden md:block" />
            INTERVIEW WITH <span className="text-blue-500">AI</span>
          </h1>

 
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Practice interviews, get instant feedback, and land your dream job with AI-powered interview preparation
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8 group">
                  Start my free session
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Explore the platform
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold mb-4">Why Choose InterviewAI?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered tools to prepare you for every aspect of the interview process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[{
            title: "AI-Powered Practice",
            description: "Get realistic interview scenarios with instant AI feedback",
            icon: CheckCircle2
          }, {
            title: "Comprehensive Coverage",
            description: "From coding tests to HR interviews, we've got you covered",
            icon: CheckCircle2
          }, {
            title: "Track Your Progress",
            description: "Monitor improvement with detailed analytics and insights",
            icon: CheckCircle2
          }].map((feature, index) => <div key={index} className="bg-card p-8 rounded-xl shadow-card hover-lift animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Ace Your Next Interview?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of candidates who have improved their interview skills with InterviewAI
            </p>
            <Link to="/signup">
              <Button size="lg" variant="accent" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>;
};
export default Landing;