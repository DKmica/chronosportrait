import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Snowflake, Check } from 'lucide-react';

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakCalendar({ profile }) {
  const days = getLast7Days();
  const history = new Set(profile?.streak_history || []);
  const freezeUsedDate = profile?.streak_freeze_used_date;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex gap-1.5 justify-between">
      {days.map((dateStr) => {
        const completed = history.has(dateStr);
        const frozen = !completed && dateStr === freezeUsedDate;
        const isToday = dateStr === today;
        const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
        const label = DAY_LABELS[dayOfWeek];

        return (
          <motion.div
            key={dateStr}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </span>
            <div className={`w-full aspect-square rounded-lg flex items-center justify-center border transition-colors ${
              completed
                ? 'bg-primary/90 border-primary'
                : frozen
                ? 'bg-blue-500/20 border-blue-400/50'
                : isToday
                ? 'border-primary/40 bg-primary/5'
                : 'bg-muted/40 border-border'
            }`}>
              {completed ? (
                <Flame className="w-3.5 h-3.5 text-primary-foreground" />
              ) : frozen ? (
                <Snowflake className="w-3 h-3 text-blue-400" />
              ) : isToday ? (
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}