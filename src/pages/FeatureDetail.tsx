import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "@/data/features";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const FeatureDetail = () => {
  const { featureId } = useParams();
  const feature = features.find((f) => f.id === featureId);

  if (!feature) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Feature Not Found</h1>
          <Link to="/features">
            <Button>Back to Features</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-5xl mx-auto">
        <Link to="/features" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Features
        </Link>

        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex items-start gap-6 mb-12">
            <div className={`w-20 h-20 rounded-2xl bg-${feature.color}/10 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-10 h-10 text-${feature.color}`} />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{feature.title}</h1>
              <p className="text-xl text-muted-foreground">{feature.description}</p>
            </div>
          </div>

          {/* Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{feature.details.overview}</p>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Key Benefits</CardTitle>
                <CardDescription>What you'll gain from this feature</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feature.details.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Simple steps to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {feature.details.howItWorks.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Try {feature.title} now and take your interview preparation to the next level
            </p>
            <Link to={`/${feature.id}`}>
              <Button size="lg" variant="default">
                Start Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetail;
