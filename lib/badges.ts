export interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: {
    type: string;
    count: number;
  };
}

export const badges: Badge[] = [
  // Exercise badges
  { id: "exercise_beginner", name: "Exercise Novice", description: "Complete 5 exercise tasks", requirement: { type: "Exercise", count: 5 } },
  { id: "exercise_intermediate", name: "Fitness Enthusiast", description: "Complete 25 exercise tasks", requirement: { type: "Exercise", count: 25 } },
  { id: "exercise_advanced", name: "Workout Warrior", description: "Complete 50 exercise tasks", requirement: { type: "Exercise", count: 50 } },
  { id: "exercise_master", name: "Fitness Master", description: "Complete 100 exercise tasks", requirement: { type: "Exercise", count: 100 } },
  { id: "exercise_legend", name: "Exercise Legend", description: "Complete 250 exercise tasks", requirement: { type: "Exercise", count: 250 } },

  // Water intake badges
  { id: "water_beginner", name: "Hydration Starter", description: "Complete 5 water intake tasks", requirement: { type: "Water", count: 5 } },
  { id: "water_intermediate", name: "Well-Hydrated", description: "Complete 25 water intake tasks", requirement: { type: "Water", count: 25 } },
  { id: "water_advanced", name: "Hydration Pro", description: "Complete 50 water intake tasks", requirement: { type: "Water", count: 50 } },
  { id: "water_master", name: "Hydration Master", description: "Complete 100 water intake tasks", requirement: { type: "Water", count: 100 } },
  { id: "water_legend", name: "Hydration Legend", description: "Complete 250 water intake tasks", requirement: { type: "Water", count: 250 } },

  // Sleep badges
  { id: "sleep_beginner", name: "Sleep Tracker", description: "Complete 5 sleep tasks", requirement: { type: "Sleep", count: 5 } },
  { id: "sleep_intermediate", name: "Well-Rested", description: "Complete 25 sleep tasks", requirement: { type: "Sleep", count: 25 } },
  { id: "sleep_advanced", name: "Sleep Expert", description: "Complete 50 sleep tasks", requirement: { type: "Sleep", count: 50 } },
  { id: "sleep_master", name: "Sleep Master", description: "Complete 100 sleep tasks", requirement: { type: "Sleep", count: 100 } },
  { id: "sleep_legend", name: "Sleep Legend", description: "Complete 250 sleep tasks", requirement: { type: "Sleep", count: 250 } },

  // Steps badges
  { id: "steps_beginner", name: "Step Counter", description: "Complete 5 step tasks", requirement: { type: "Steps", count: 5 } },
  { id: "steps_intermediate", name: "Active Walker", description: "Complete 25 step tasks", requirement: { type: "Steps", count: 25 } },
  { id: "steps_advanced", name: "Step Champion", description: "Complete 50 step tasks", requirement: { type: "Steps", count: 50 } },
  { id: "steps_master", name: "Walking Master", description: "Complete 100 step tasks", requirement: { type: "Steps", count: 100 } },
  { id: "steps_legend", name: "Step Legend", description: "Complete 250 step tasks", requirement: { type: "Steps", count: 250 } },

  // Total tasks badges
  { id: "total_beginner", name: "Health Novice", description: "Complete 20 total tasks", requirement: { type: "Total", count: 20 } },
  { id: "total_intermediate", name: "Health Enthusiast", description: "Complete 100 total tasks", requirement: { type: "Total", count: 100 } },
  { id: "total_advanced", name: "Health Pro", description: "Complete 250 total tasks", requirement: { type: "Total", count: 250 } },
  { id: "total_master", name: "Health Master", description: "Complete 500 total tasks", requirement: { type: "Total", count: 500 } },
  { id: "total_legend", name: "Health Legend", description: "Complete 1000 total tasks", requirement: { type: "Total", count: 1000 } },
];

export function checkBadgeUnlock(taskType: string, taskCount: number, totalTasks: number): Badge[] {
  const unlockedBadges: Badge[] = [];

  badges.forEach(badge => {
    if (
      (badge.requirement.type === taskType && taskCount >= badge.requirement.count) ||
      (badge.requirement.type === "Total" && totalTasks >= badge.requirement.count)
    ) {
      unlockedBadges.push(badge);
    }
  });

  return unlockedBadges;
}

