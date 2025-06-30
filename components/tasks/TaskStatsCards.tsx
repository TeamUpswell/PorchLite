"use client";

import { ManualStyleCard } from "@/components/ui/StandardCard";
import { CheckSquareIcon, Clock, Users, CheckCircle } from "lucide-react";

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface TaskStatsCardsProps {
  stats: TaskStats;
}

export default function TaskStatsCards({ stats }: TaskStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <ManualStyleCard
        title="Total Tasks"
        badge={`${stats.total} total`}
        icon={<CheckSquareIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
        </div>
      </ManualStyleCard>

      <ManualStyleCard
        title="Pending"
        badge={`${stats.pending} pending`}
        icon={<Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.pending}
          </div>
        </div>
      </ManualStyleCard>

      <ManualStyleCard
        title="In Progress"
        badge={`${stats.inProgress} active`}
        icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.inProgress}
          </div>
        </div>
      </ManualStyleCard>

      <ManualStyleCard
        title="Completed"
        badge={`${stats.completed} done`}
        icon={<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.completed}
          </div>
        </div>
      </ManualStyleCard>
    </div>
  );
}
