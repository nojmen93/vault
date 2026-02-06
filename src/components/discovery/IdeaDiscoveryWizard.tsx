'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiscoveryProgress } from './DiscoveryProgress';
import { DiscoveryQuestion } from './DiscoveryQuestion';
import { DiscoveryResults } from './DiscoveryResults';
import { cn } from '@/lib/utils';
import type {
  DiscoveryAnswers,
  IdeaSuggestion,
  QuestionOption,
} from '@/types/discovery';

interface IdeaDiscoveryWizardProps {
  onClose: () => void;
  onIncubate: (suggestion: IdeaSuggestion) => void;
  onSave: (suggestion: IdeaSuggestion) => void;
  generateSuggestions: (
    answers: DiscoveryAnswers,
    customRequest?: string
  ) => Promise<IdeaSuggestion[]>;
  className?: string;
}

// Question configurations
const selfDescriptionOptions: QuestionOption<string>[] = [
  {
    value: 'tech_builder',
    icon: '🔧',
    label: 'I love technology and building things',
    description: 'Coding, apps, automation — that\'s my jam',
  },
  {
    value: 'creative',
    icon: '🎨',
    label: 'I\'m creative and like making things look good',
    description: 'Design, visuals, aesthetics matter to me',
  },
  {
    value: 'people_person',
    icon: '💬',
    label: 'I\'m good with people and communication',
    description: 'I enjoy teaching, helping, or connecting others',
  },
  {
    value: 'simplicity',
    icon: '✨',
    label: 'I just want something simple that works',
    description: 'No fancy stuff — keep it straightforward',
  },
  {
    value: 'domain_expert',
    icon: '🎓',
    label: 'I have expertise in a specific field',
    description: 'Years of knowledge I could share or use',
  },
  {
    value: 'not_sure',
    icon: '❓',
    label: 'Not sure yet',
    description: 'I\'m open to exploring options',
  },
];

const timeOptions: QuestionOption<string>[] = [
  {
    value: 'weekends',
    icon: '⏰',
    label: 'A few hours on weekends',
    description: 'I have a busy schedule but some free time',
  },
  {
    value: 'daily',
    icon: '📅',
    label: 'An hour or two daily',
    description: 'I can dedicate consistent daily time',
  },
  {
    value: 'all_in',
    icon: '🚀',
    label: 'I\'m going all in on this',
    description: 'This is my main focus right now',
  },
  {
    value: 'passive',
    icon: '🌴',
    label: 'Set it up once, then mostly forget it',
    description: 'Looking for passive income opportunities',
  },
];

const budgetOptions: QuestionOption<string>[] = [
  {
    value: 'zero',
    icon: '🆓',
    label: 'Zero — just my time',
    description: 'No money to invest right now',
  },
  {
    value: 'little',
    icon: '💵',
    label: 'A little ($50-200)',
    description: 'Can invest a small amount to get started',
  },
  {
    value: 'some',
    icon: '💰',
    label: 'Some savings ($500-2000)',
    description: 'Have some budget to invest in tools or resources',
  },
  {
    value: 'unlimited',
    icon: '💎',
    label: 'Money isn\'t the issue',
    description: 'Focus on the right opportunity, not the cost',
  },
];

const priorityOptions: QuestionOption<string>[] = [
  {
    value: 'money_fast',
    icon: '💸',
    label: 'Making money quickly',
  },
  {
    value: 'fulfillment',
    icon: '❤️',
    label: 'Building something I\'m proud of',
  },
  {
    value: 'flexibility',
    icon: '🏖️',
    label: 'Flexibility and freedom',
  },
  {
    value: 'helping_others',
    icon: '🤝',
    label: 'Helping others',
  },
  {
    value: 'learning',
    icon: '📚',
    label: 'Learning new things',
  },
];

type WizardStep = 'welcome' | 'q1' | 'q1_expertise' | 'q2' | 'q3' | 'q4' | 'q5' | 'results';

export function IdeaDiscoveryWizard({
  onClose,
  onIncubate,
  onSave,
  generateSuggestions,
  className,
}: IdeaDiscoveryWizardProps): React.ReactElement {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [answers, setAnswers] = useState<DiscoveryAnswers>({});
  const [suggestions, setSuggestions] = useState<IdeaSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const totalQuestions = 5;
  const getCurrentQuestionNumber = (): number => {
    switch (step) {
      case 'q1':
      case 'q1_expertise':
        return 1;
      case 'q2':
        return 2;
      case 'q3':
        return 3;
      case 'q4':
        return 4;
      case 'q5':
        return 5;
      default:
        return 0;
    }
  };

  const handleNext = useCallback(async (): Promise<void> => {
    switch (step) {
      case 'welcome':
        setStep('q1');
        break;
      case 'q1':
        if (answers.selfDescription === 'domain_expert') {
          setStep('q1_expertise');
        } else {
          setStep('q2');
        }
        break;
      case 'q1_expertise':
        setStep('q2');
        break;
      case 'q2':
        setStep('q3');
        break;
      case 'q3':
        setStep('q4');
        break;
      case 'q4':
        setStep('q5');
        break;
      case 'q5':
        // Generate suggestions
        setStep('results');
        setIsLoading(true);
        try {
          const result = await generateSuggestions(answers);
          setSuggestions(result);
        } catch (error) {
          console.error('Failed to generate suggestions:', error);
          // Keep empty suggestions, user can retry
        } finally {
          setIsLoading(false);
        }
        break;
    }
  }, [step, answers, generateSuggestions]);

  const handleBack = (): void => {
    switch (step) {
      case 'q1':
        setStep('welcome');
        break;
      case 'q1_expertise':
        setStep('q1');
        break;
      case 'q2':
        if (answers.selfDescription === 'domain_expert') {
          setStep('q1_expertise');
        } else {
          setStep('q1');
        }
        break;
      case 'q3':
        setStep('q2');
        break;
      case 'q4':
        setStep('q3');
        break;
      case 'q5':
        setStep('q4');
        break;
      case 'results':
        setStep('q5');
        break;
    }
  };

  const handleSkip = (): void => {
    switch (step) {
      case 'q1':
        setAnswers((prev) => ({ ...prev, selfDescription: undefined }));
        setStep('q2');
        break;
      case 'q1_expertise':
        setAnswers((prev) => ({ ...prev, expertiseField: undefined }));
        setStep('q2');
        break;
      case 'q2':
        setAnswers((prev) => ({ ...prev, timeAvailability: undefined }));
        setStep('q3');
        break;
      case 'q3':
        setAnswers((prev) => ({ ...prev, budget: undefined }));
        setStep('q4');
        break;
      case 'q4':
        setAnswers((prev) => ({ ...prev, priorities: undefined }));
        setStep('q5');
        break;
      case 'q5':
        setAnswers((prev) => ({ ...prev, skills: undefined }));
        handleNext();
        break;
    }
  };

  const handleLoadMore = async (): Promise<void> => {
    setIsLoadingMore(true);
    try {
      const moreSuggestions = await generateSuggestions(answers);
      setSuggestions((prev) => [...prev, ...moreSuggestions]);
    } catch (error) {
      console.error('Failed to load more suggestions:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCustomRequest = async (request: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await generateSuggestions(answers, request);
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to generate custom suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = (): void => {
    setAnswers({});
    setSuggestions([]);
    setStep('welcome');
  };

  const handleDismiss = (suggestion: IdeaSuggestion): void => {
    // Could save to DB as dismissed
    console.log('Dismissed:', suggestion.id);
  };

  const renderStep = (): React.ReactElement => {
    switch (step) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center h-full py-12"
          >
            <span className="text-6xl mb-6">💡</span>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Let&apos;s find the perfect idea for you
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              Answer a few quick questions — skip any you&apos;re not sure about.
              There are no wrong answers.
            </p>
            <Button size="lg" onClick={handleNext}>
              Get Started
            </Button>
          </motion.div>
        );

      case 'q1':
        return (
          <DiscoveryQuestion
            question="What sounds most like you?"
            type="single"
            options={selfDescriptionOptions}
            value={answers.selfDescription}
            onChange={(value) =>
              setAnswers((prev) => ({
                ...prev,
                selfDescription: value as DiscoveryAnswers['selfDescription'],
              }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            isFirst
          />
        );

      case 'q1_expertise':
        return (
          <DiscoveryQuestion
            question="What's your field?"
            subtitle="Tell me about your expertise or background"
            type="text"
            placeholder="e.g., nursing, accounting, teaching, real estate..."
            value={answers.expertiseField}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, expertiseField: value as string }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );

      case 'q2':
        return (
          <DiscoveryQuestion
            question="How much time can you invest?"
            type="single"
            options={timeOptions}
            value={answers.timeAvailability}
            onChange={(value) =>
              setAnswers((prev) => ({
                ...prev,
                timeAvailability: value as DiscoveryAnswers['timeAvailability'],
              }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );

      case 'q3':
        return (
          <DiscoveryQuestion
            question="What's your budget to start?"
            type="single"
            options={budgetOptions}
            value={answers.budget}
            onChange={(value) =>
              setAnswers((prev) => ({
                ...prev,
                budget: value as DiscoveryAnswers['budget'],
              }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );

      case 'q4':
        return (
          <DiscoveryQuestion
            question="What matters most to you?"
            subtitle="This helps me prioritize the right opportunities"
            type="multi"
            maxSelections={2}
            options={priorityOptions}
            value={answers.priorities}
            onChange={(value) =>
              setAnswers((prev) => ({
                ...prev,
                priorities: value as DiscoveryAnswers['priorities'],
              }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );

      case 'q5':
        return (
          <DiscoveryQuestion
            question="Any skills or experience to leverage?"
            subtitle="This is optional but helps me personalize suggestions"
            type="text"
            placeholder="e.g., I'm a nurse, I speak Spanish, I'm good at organizing, I know Excel, I love dogs..."
            value={answers.skills}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, skills: value as string }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            skipLabel="Starting fresh / Not sure"
          />
        );

      case 'results':
        return (
          <DiscoveryResults
            suggestions={suggestions}
            onIncubate={onIncubate}
            onSave={onSave}
            onDismiss={handleDismiss}
            onLoadMore={handleLoadMore}
            onCustomRequest={handleCustomRequest}
            onStartOver={handleStartOver}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  const showProgress = step !== 'welcome' && step !== 'results';
  const currentQuestion = getCurrentQuestionNumber();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {step !== 'welcome' && step !== 'results' && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-semibold">Find Your Idea</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="px-4 py-3 border-b">
          <DiscoveryProgress
            currentStep={currentQuestion}
            totalSteps={totalQuestions}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto h-full">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
