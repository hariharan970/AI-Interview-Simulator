import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import Landing from "./pages/Landing";
import Features from "./pages/Features";
import FeatureDetail from "./pages/FeatureDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import MockInterview from "./pages/MockInterview";
import CodingTest from "./pages/CodingTest";
import AptitudeTest from "./pages/AptitudeTest";
import MockHRInterview from "./pages/MockHRInterview";
import VideoInterview from "./pages/VideoInterview";
import GroupDiscussion from "./pages/GroupDiscussion";
import ResumeBuilder from "./pages/ResumeBuilder";
import CareerGuide from "./pages/CareerGuide";
import InterviewInsights from "./pages/InterviewInsights";
import CareerRoadmap from "./pages/CareerRoadmap";
import SalaryEstimator from "./pages/SalaryEstimator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/features/:featureId" element={<FeatureDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/coding-test" element={<CodingTest />} />
            <Route path="/aptitude-test" element={<AptitudeTest />} />
            <Route path="/group-discussion" element={<GroupDiscussion />} />
            <Route path="/video-interview" element={<VideoInterview />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/career-guide" element={<CareerGuide />} />
            <Route path="/mock-hr-interview" element={<MockHRInterview />} />
            <Route path="/interview-insights" element={<InterviewInsights />} />
            <Route path="/career-roadmap" element={<CareerRoadmap />} />
            <Route path="/salary-estimator" element={<SalaryEstimator />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
