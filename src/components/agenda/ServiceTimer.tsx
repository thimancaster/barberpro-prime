import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';

interface ServiceTimerProps {
  startTime: string;
  expectedDurationMinutes: number;
  className?: string;
}

export function ServiceTimer({ startTime, expectedDurationMinutes, className = '' }: ServiceTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startTime);
      const seconds = differenceInSeconds(now, start);
      setElapsedSeconds(seconds);
      setIsOvertime(seconds > expectedDurationMinutes * 60);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, expectedDurationMinutes]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const progress = Math.min((elapsedMinutes / expectedDurationMinutes) * 100, 100);
  const overtimeMinutes = Math.max(0, elapsedMinutes - expectedDurationMinutes);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        {isOvertime ? (
          <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 text-primary" />
        )}
        <span className={`font-mono text-sm font-medium ${isOvertime ? 'text-destructive' : 'text-foreground'}`}>
          {formatTime(elapsedSeconds)}
        </span>
      </div>
      
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full transition-all duration-1000 ${
            isOvertime ? 'bg-destructive' : progress > 80 ? 'bg-warning' : 'bg-primary'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isOvertime ? (
          <span className="text-destructive">+{overtimeMinutes}min</span>
        ) : (
          `${expectedDurationMinutes - elapsedMinutes}min`
        )}
      </span>
    </div>
  );
}
