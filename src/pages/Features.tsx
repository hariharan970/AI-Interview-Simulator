import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "@/data/features";
import { ArrowRight } from "lucide-react";

const Features = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4">Our Features</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI-powered tools to help you prepare for every stage of the interview process
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Interview Insights - Featured at Top */}
          <div className="mb-12">
            {features.slice(0, 1).map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.id}
                  to={`/features/${feature.id}`}
                  className="group"
                >
                  <Card className="h-full hover-lift animate-fade-in border-2 border-accent/50">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 text-${feature.color}`} />
                      </div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Learn more
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Remaining Features - 4 per row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.slice(1).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.id}
                  to={`/features/${feature.id}`}
                  className="group"
                >
                  <Card className="h-full hover-lift animate-fade-in" style={{ animationDelay: `${(index + 1) * 0.05}s` }}>
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 text-${feature.color}`} />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Learn more
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
