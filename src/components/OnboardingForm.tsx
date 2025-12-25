'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonalizationData, LearningSession } from '@/types';
import { saveSession } from '@/lib/context-manager';

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: "Let's Get Started", description: "Tell us about yourself" },
  { id: 2, title: "What Do You Want to Learn?", description: "Choose your learning topic" },
  { id: 3, title: "Your Background", description: "Help us personalize your experience" },
  { id: 4, title: "Learning Preferences", description: "Set your goals and pace" }
];

export default function OnboardingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PersonalizationData>({
    name: '',
    topic: '',
    background: '',
    knowledgeLevel: 'complete-beginner',
    learningGoals: '',
    timeCommitment: 'moderate'
  });

  const updateFormData = (field: keyof PersonalizationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.topic.trim().length > 0;
      case 3:
        return formData.background.trim().length > 0;
      case 4:
        return formData.learningGoals.trim().length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalization: formData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate curriculum');
      }

      const data = await response.json();
      
      // Create and save session
      const session: LearningSession = {
        id: data.sessionId,
        personalization: formData,
        curriculum: data.curriculum,
        chatHistories: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      saveSession(session);
      
      // Navigate to learning page
      router.push(`/learn/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">What should I call you?</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">What topic would you like to master?</Label>
              <Input
                id="topic"
                placeholder="e.g., Machine Learning, Guitar, Cooking, JavaScript..."
                value={formData.topic}
                onChange={(e) => updateFormData('topic', e.target.value)}
                className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <p className="text-sm text-zinc-500">
                Be as specific or broad as you like. I&apos;ll create a personalized curriculum just for you.
              </p>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="background">Tell me about your background</Label>
              <Textarea
                id="background"
                placeholder="What's your experience? What related topics do you know? What's your profession or field of study?"
                value={formData.background}
                onChange={(e) => updateFormData('background', e.target.value)}
                className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="knowledgeLevel">Current knowledge level in {formData.topic || 'this topic'}</Label>
              <Select
                value={formData.knowledgeLevel}
                onValueChange={(value) => updateFormData('knowledgeLevel', value)}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="complete-beginner">Complete Beginner - Never touched it</SelectItem>
                  <SelectItem value="some-familiarity">Some Familiarity - Know the basics</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Have some experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goals">What are your learning goals?</Label>
              <Textarea
                id="goals"
                placeholder="What do you want to achieve? Why are you learning this? Any specific projects or applications in mind?"
                value={formData.learningGoals}
                onChange={(e) => updateFormData('learningGoals', e.target.value)}
                className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeCommitment">How much time can you dedicate?</Label>
              <Select
                value={formData.timeCommitment}
                onValueChange={(value) => updateFormData('timeCommitment', value)}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white">
                  <SelectValue placeholder="Select your pace" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="casual">Casual - A few hours per week</SelectItem>
                  <SelectItem value="moderate">Moderate - Several hours per week</SelectItem>
                  <SelectItem value="intensive">Intensive - Daily focused learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(63 63 70 / 0.4) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <Card className="w-full max-w-lg bg-zinc-900/80 border-zinc-800 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center border-b border-zinc-800 pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      currentStep > step.id 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : currentStep === step.id 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 scale-110' 
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-colors ${
                      currentStep > step.id ? 'bg-emerald-500/50' : 'bg-zinc-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl font-light text-white">
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-8">
          <div className="min-h-[200px]">
            {renderStepContent()}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1 || isLoading}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              ← Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-medium px-6"
              >
                Continue →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-medium px-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating Curriculum...
                  </span>
                ) : (
                  'Start Learning →'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

