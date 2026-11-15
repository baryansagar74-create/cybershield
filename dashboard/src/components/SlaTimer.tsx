import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Clock } from 'lucide-react';

interface SlaTimerProps {
  initialMinutes: number;
  className?: string;
  showIcon?: boolean;
}

export const SlaTimer: React.FC<SlaTimerProps> = ({
  initialMinutes,
  className,
  showIcon = true,
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    // Tick down every minute (or simulated in mock)
    const interval = setInterval(() => {
      setMinutes((prev) => Math.max(0, prev - 1));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  const isUrgent30m = minutes <= 30 && minutes > 0;
  const isUrgent2h = minutes <= 120 && minutes > 30;
  const isOverdue = minutes === 0;

  let stateStyle = "text-txt-muted border-line bg-sunken/40";
  if (isOverdue) {
    stateStyle = "text-risk-high border-risk-high/40 bg-risk-high/10 font-semibold";
  } else if (isUrgent30m) {
    stateStyle = "text-risk-high border-risk-high/40 bg-risk-high/10 animate-pulse font-semibold";
  } else if (isUrgent2h) {
    stateStyle = "text-saffron border-saffron/40 bg-saffron/10 font-medium";
  }

  const formattedTime = isOverdue 
    ? "SLA BREACHED" 
    : `${hours > 0 ? `${hours}h ` : ''}${remainingMins}m remaining`;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-chip text-2xs font-mono tabular-nums border select-none",
        stateStyle,
        className
      )}
      title={`Statutory countdown timer: ${minutes} minutes left`}
    >
      {showIcon && <Clock className="w-3 h-3 flex-shrink-0" />}
      <span>{formattedTime}</span>
    </span>
  );
};
