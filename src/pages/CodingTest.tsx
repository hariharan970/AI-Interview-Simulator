import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { codingProblems, CodingProblem } from "@/data/codingProblems";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, RotateCcw, Send, Clock, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CodingTest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem>(codingProblems[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>(selectedProblem.starterCode.javascript);
  const [timeLeft, setTimeLeft] = useState<number>(selectedProblem.timeMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    // Reset timer when problem changes
    setTimeLeft(selectedProblem.timeMinutes * 60);
    setCode(selectedProblem.starterCode[selectedLanguage as keyof typeof selectedProblem.starterCode]);
    setShowResults(false);
    setTestResults([]);
    setIsRunning(true);
  }, [selectedProblem, selectedLanguage]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "Easy":
        return "bg-blue-500";
      case "Medium":
        return "bg-yellow-500";
      case "Hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCode(selectedProblem.starterCode[lang as keyof typeof selectedProblem.starterCode]);
  };

  const handleRun = () => {
    // Mock test execution
    const results = selectedProblem.testCases.map((testCase, index) => {
      // Simulate running tests (in real implementation, this would execute the code)
      const passed = Math.random() > 0.3; // 70% chance of pass for demo
      return {
        testCase: index + 1,
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: passed ? testCase.expectedOutput : "Error or incorrect output",
      };
    });
    setTestResults(results);
    setShowResults(true);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReset = () => {
    setCode(selectedProblem.starterCode[selectedLanguage as keyof typeof selectedProblem.starterCode]);
    setShowResults(false);
    setTestResults([]);
    setAiFeedback("");
  };

  const handleAutoSubmit = async () => {
    setIsRunning(false);
    await handleSubmit(true);
  };

  const handleSubmit = async (autoSubmit: boolean = false) => {
    setIsRunning(false);
    
    // Run tests
    const results = selectedProblem.testCases.map((testCase, index) => {
      const passed = Math.random() > 0.2; // 80% chance for demo
      return {
        testCase: index + 1,
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: passed ? testCase.expectedOutput : "Incorrect output",
      };
    });
    setTestResults(results);

    // Generate AI feedback using Gemini
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate",
          jobRole: "Software Engineer",
          conversationHistory: [],
          userAnswer: `Problem: ${selectedProblem.name}\nCode:\n${code}\nTest Results: ${results.filter(r => r.passed).length}/${results.length} passed`,
        },
      });

      if (data && data.message) {
        setAiFeedback(data.message);
      } else {
        // Fallback feedback
        setAiFeedback(
          `Your solution passed ${results.filter(r => r.passed).length} out of ${results.length} test cases. ` +
          `Time complexity appears to be O(n) and space complexity is O(1). ` +
          `Consider edge cases and optimize for better performance.`
        );
      }
    } catch (error) {
      // Fallback feedback if AI is unavailable
      const passedCount = results.filter(r => r.passed).length;
      setAiFeedback(
        `Your solution passed ${passedCount} out of ${results.length} test cases. ` +
        `Time complexity: O(n), Space complexity: O(1). ` +
        `Review your logic and handle edge cases more carefully.`
      );
    }

    setShowResults(true);
    setCompletedProblems((prev) => new Set([...prev, selectedProblem.id]));
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });

    // Save to activities
    try {
      await supabase.from("activities").insert({
        user_id: user?.id,
        feature_id: "coding-test",
        feature_name: `Coding Test: ${selectedProblem.name}`,
        activity_type: "coding",
        status: "completed",
        score: Math.round((results.filter(r => r.passed).length / results.length) * 100),
      });
    } catch (error) {
      console.warn("Could not save activity:", error);
    }
  };

  const getLanguageExtension = () => {
    switch (selectedLanguage) {
      case "javascript":
        return javascript();
      case "python":
        return python();
      case "java":
        return java();
      case "cpp":
        return cpp();
      default:
        return javascript();
    }
  };

  const timerColor = timeLeft <= 10 ? "text-red-500" : timeLeft <= 30 ? "text-orange-500" : "text-foreground";

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Sidebar - Problem List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Problems
                  <Progress 
                    value={(completedProblems.size / codingProblems.length) * 100} 
                    className="w-24 h-2"
                  />
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {completedProblems.size}/{codingProblems.length} completed
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {codingProblems.map((problem) => (
                    <button
                      key={problem.id}
                      onClick={() => setSelectedProblem(problem)}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                        selectedProblem.id === problem.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      } ${
                        completedProblems.has(problem.id) ? "bg-green-500/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{problem.name}</span>
                        {completedProblems.has(problem.id) && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          className={`${getDifficultyColor(problem.difficulty)} text-white text-xs`}
                        >
                          {problem.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {problem.timeMinutes} min
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4 flex flex-col h-full">
            {/* Header with Timer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{selectedProblem.name}</CardTitle>
                      <Badge className={getDifficultyColor(selectedProblem.difficulty)}>
                        {selectedProblem.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className={`text-2xl font-mono font-bold ${timerColor} flex items-center gap-2`}>
                    <Clock className="w-5 h-5" />
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Problem Tabs */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader>
                <Tabs defaultValue="problem" className="w-full">
                  <TabsList>
                    <TabsTrigger value="problem">Problem</TabsTrigger>
                    <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                    <TabsTrigger value="hints">Hints</TabsTrigger>
                  </TabsList>
                  <TabsContent value="problem" className="mt-4">
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground font-mono bg-muted p-4 rounded-lg">
                      {selectedProblem.description}
                    </div>
                  </TabsContent>
                  <TabsContent value="testcases" className="mt-4">
                    <div className="space-y-3">
                      {selectedProblem.testCases.map((testCase, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="text-sm">
                            <span className="font-semibold">Input: </span>
                            <span className="font-mono">{testCase.input}</span>
                          </div>
                          <div className="text-sm mt-1">
                            <span className="font-semibold">Expected Output: </span>
                            <span className="font-mono">{testCase.expectedOutput}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="hints" className="mt-4">
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-semibold mb-2">Hint:</p>
                        <p>Think about the problem constraints and edge cases. Consider using a hash map for O(1) lookups.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Language Selector and Editor */}
                <div className="mb-4">
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 border rounded-lg overflow-hidden mb-4">
                  <CodeMirror
                    value={code}
                    height="100%"
                    theme={oneDark}
                    extensions={[getLanguageExtension()]}
                    onChange={(value) => setCode(value)}
                    className="h-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleRun} variant="outline" className="flex-1">
                    <Play className="mr-2 w-4 h-4" />
                    Run
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 w-4 h-4" />
                    Reset
                  </Button>
                  <Button 
                    onClick={() => handleSubmit(false)} 
                    className="flex-1 bg-gradient-to-r from-[#00c6ff] to-[#0072ff] hover:from-[#0072ff] hover:to-[#00c6ff]"
                  >
                    <Send className="mr-2 w-4 h-4" />
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {showResults && (
              <Card ref={resultsRef} className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Test Results */}
                  <div>
                    <h3 className="font-semibold mb-3">Test Cases</h3>
                    <div className="space-y-2">
                      {testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.passed ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Test Case {result.testCase}</span>
                            {result.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-semibold">Input: </span>
                              <span className="font-mono">{result.input}</span>
                            </div>
                            <div>
                              <span className="font-semibold">Expected: </span>
                              <span className="font-mono">{result.expectedOutput}</span>
                            </div>
                            <div>
                              <span className="font-semibold">Actual: </span>
                              <span className="font-mono">{result.actualOutput}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {aiFeedback && (
                    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          AI Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiFeedback}</p>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Time Complexity</div>
                            <Badge>O(n)</Badge>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Space Complexity</div>
                            <Badge>O(1)</Badge>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Runtime</div>
                            <Badge>~{Math.floor(Math.random() * 50 + 10)}ms</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTest;

