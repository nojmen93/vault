'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { QuestionOption } from '@/types/discovery';

interface DiscoveryQuestionProps {
  question: string;
  subtitle?: string;
  type: 'single' | 'multi' | 'text';
  options?: QuestionOption<string>[];
  maxSelections?: number;
  placeholder?: string;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
  isFirst?: boolean;
  skipLabel?: string;
}

export function DiscoveryQuestion({
  question,
  subtitle,
  type,
  options = [],
  maxSelections = 2,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
  isFirst = false,
  skipLabel = 'Skip',
}: DiscoveryQuestionProps): React.ReactElement {
  const [textValue, setTextValue] = useState(
    typeof value === 'string' ? value : ''
  );

  const handleSingleSelect = (optionValue: string): void => {
    onChange(optionValue);
    // Auto-advance after selection with a brief delay
    setTimeout(onNext, 300);
  };

  const handleMultiSelect = (optionValue: string): void => {
    const currentValues = Array.isArray(value) ? value : [];
    if (currentValues.includes(optionValue)) {
      onChange(currentValues.filter((v) => v !== optionValue));
    } else if (currentValues.length < maxSelections) {
      onChange([...currentValues, optionValue]);
    }
  };

  const handleTextSubmit = (): void => {
    onChange(textValue);
    onNext();
  };

  const isSelected = (optionValue: string): boolean => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          {question}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        )}
        {type === 'multi' && (
          <p className="text-sm text-muted-foreground mt-2">
            Select up to {maxSelections}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1">
        {type === 'text' ? (
          <div className="space-y-4">
            <Input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={placeholder}
              className="h-14 text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textValue.trim()) {
                  handleTextSubmit();
                }
              }}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!textValue.trim()}
              className="w-full h-12"
            >
              Continue
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onChange('');
                onSkip();
              }}
              className="w-full"
            >
              Starting fresh / Not sure
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option) => (
              <motion.button
                key={option.value}
                onClick={() =>
                  type === 'single'
                    ? handleSingleSelect(option.value)
                    : handleMultiSelect(option.value)
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-start gap-4 p-4 md:p-5 rounded-xl border-2 text-left transition-all',
                  'min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected(option.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                aria-pressed={isSelected(option.value)}
              >
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  {option.icon}
                </span>
                <div>
                  <span className="font-medium text-base md:text-lg block">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-sm text-muted-foreground mt-1 block">
                      {option.description}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t">
        <div>
          {!isFirst && onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onSkip}>
            {skipLabel}
          </Button>
          {type === 'multi' && (
            <Button
              onClick={onNext}
              disabled={!Array.isArray(value) || value.length === 0}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
