"use client";

import StandardCard from "@/components/ui/StandardCard";
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
      <StandardCard>
        <div className="flex items-center">
          <CheckSquareIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Tasks
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>
      </StandardCard>

      <StandardCard>
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-yellow-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pending}
            </p>
          </div>
        </div>
      </StandardCard>

      <StandardCard>
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              In Progress
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.inProgress}
            </p>
          </div>
        </div>
      </StandardCard>

      <StandardCard>
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.completed}
            </p>
          </div>
        </div>
      </StandardCard>
    </div>
  );
}
