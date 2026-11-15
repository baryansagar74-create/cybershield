import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Check, Loader2 } from 'lucide-react';
import { useApp } from '../lib/state';

interface Step {
  id: number;
  label: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, label: "Input", description: "Target parsed" },
  { id: 2, label: "Fetch", description: "Public DOM extracted" },
  { id: 3, label: "Extract features", description: "9 forensic features" },
  { id: 4, label: "Score", description: "Random Forest evaluation" },
  { id: 5, label: "Risk band", description: "Threshold arbitration" },
  { id: 6, label: "Analyst review", description: "Dossier prepared" },
];

interface ScanPipelineProps {
  onComplete: () => void;
  targetHandle: string;
}

export const ScanPipeline: React.FC<ScanPipelineProps> = ({
  onComplete,
  targetHandle,
}) => {
  const { reducedMotion } = useApp();
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    if (reducedMotion) {
      // Complete immediately
      const timer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(timer);
    }

    let current = 1;
    const runNextStep = () => {
      // 400-700ms random duration per step
      const stepDuration = 400 + Math.floor(Math.random() * 300);
      
      const timer = setTimeout(() => {
        if (current < 6) {
          current += 1;
          setActiveStep(current);
          runNextStep();
        } else {
          // Final node resolves into transition to Assessment screen (350ms)
          setTimeout(() => {
            onComplete();
          }, 350);
        }
      }, stepDuration);
      
      return timer;
    };

    const firstTimer = runNextStep();
    return () => clearTimeout(firstTimer);
  }, [reducedMotion, onComplete]);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 bg-raised border border-line rounded-panel">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-line">
        <div>
          <span className="text-2xs uppercase tracking-wider text-txt-muted font-mono">Simulated Pipeline Execution</span>
          <h4 className="text-base font-semibold text-txt">Analyzing @{targetHandle}</h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-teal font-medium">
            Step {activeStep} of 6
          </span>
        </div>
      </div>

      {/* Connected Nodes Row */}
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-line z-0" />
        
        {/* Animated Active Progress Line */}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-teal z-0 transition-all duration-300"
          style={{ width: `${((activeStep - 1) / 5) * 88}%` }}
        />

        {steps.map((s) => {
          const isCompleted = s.id < activeStep;
          const isActive = s.id === activeStep;

          return (
            <div key={s.id} className="relative flex flex-col items-center z-10">
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 select-none bg-raised",
                  isCompleted && "bg-teal border-teal text-white",
                  isActive && "border-teal text-teal shadow-[0_0_0_4px_rgba(18,168,157,0.2)]",
                  !isCompleted && !isActive && "border-line text-txt-muted bg-sunken"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="font-mono text-xs font-medium">{s.id}</span>
                )}
              </div>

              <div className="text-center mt-2 w-24">
                <p className={clsx("text-xs font-medium", isActive ? "text-teal" : isCompleted ? "text-txt" : "text-txt-muted")}>
                  {s.label}
                </p>
                <p className="text-[10px] text-txt-muted line-clamp-1">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
