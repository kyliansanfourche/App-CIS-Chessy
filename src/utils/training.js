import { TRAINING_STRUCTURE } from '../constants';

export function calculateProgress(user) {
  if (!user) return 0;
  const baseTotal = TRAINING_STRUCTURE.reduce((acc, m) => acc + m.goals.length, 0);
  const total = baseTotal + (user.customGoals?.length || 0);
  if (total === 0) return 0;
  return Math.round(((user.completedGoals?.length || 0) / total) * 100);
}
