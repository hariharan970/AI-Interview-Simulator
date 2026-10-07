import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Shield, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-5xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4">About InterviewAI</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering candidates worldwide with AI-powered interview preparation
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-12 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-3xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At InterviewAI, we believe that everyone deserves the opportunity to showcase their best self in interviews. 
              Our platform leverages cutting-edge artificial intelligence to provide personalized, comprehensive interview 
              preparation that adapts to your unique needs and goals. We're committed to making professional success 
              accessible to all through innovative technology and expert guidance.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            {
              icon: Target,
              title: "Goal-Oriented",
              description: "Every feature is designed with your success in mind, helping you achieve your career objectives."
            },
            {
              icon: Users,
              title: "User-Centric",
              description: "We listen to our community and continuously improve based on real user feedback and needs."
            },
            {
              icon: Shield,
              title: "Privacy First",
              description: "Your data is encrypted and secure. We never share your information with third parties."
            },
            {
              icon: Zap,
              title: "Innovation Driven",
              description: "We leverage the latest AI technology to provide the most effective interview preparation tools."
            }
          ].map((value, index) => (
            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader>
                <value.icon className="w-12 h-12 text-primary mb-4" />
                <CardTitle>{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Capabilities */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Our AI Technology</CardTitle>
            <CardDescription>Powered by advanced machine learning and natural language processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Our AI system is trained on thousands of real interview scenarios across various industries and roles. 
              It can analyze your responses, body language, tone, and technical skills to provide comprehensive feedback.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The platform continuously learns and adapts to industry trends, ensuring that you're always prepared with 
              the most current and relevant interview techniques.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              We take your privacy seriously. All your practice sessions, recordings, and personal data are encrypted 
              and stored securely. We never sell or share your information with third parties. You have complete control 
              over your data and can delete it at any time. Our AI analysis happens in secure, isolated environments, 
              ensuring your information remains confidential.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
