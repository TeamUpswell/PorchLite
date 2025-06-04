"use client";

import StandardCard from "@/components/ui/StandardCard";
import { CheckSquare, ExternalLink, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface TaskAlertsProps {
  alerts: any[]; // These are actually tasks now
}

export default function TaskAlerts({ alerts }: TaskAlertsProps) {
  return (
    <StandardCard className="h-fit">
      <div className="flex items-center justify-between mb-4">
        {/* Clickable header */}
        <Link 
          href="/tasks" 
          className="text-lg font-semibold text-gray-900 flex items-center hover:text-purple-600 transition-colors group"
        >
          <CheckSquare className="h-5 w-5 mr-2 text-purple-500 group-hover:text-purple-600" />
          Tasks & To-Do
          <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/tasks"
          className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          View All
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No pending tasks</p>
          <Link 
            href="/tasks"
            className="text-purple-600 hover:text-purple-800 text-sm underline"
          >
            View all tasks
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((task) => (
            <Link
              key={task.id}
              href={`/tasks?task=${task.id}`}
              className="block border border-purple-200 rounded-lg p-3 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    {task.due_date && (
                      <>
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </>
                    )}
                    {task.estimated_duration && (
                      <>
                        <Clock className="h-3 w-3 ml-3 mr-1" />
                        {task.estimated_duration}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.status === 'pending' 
                      ? 'bg-orange-100 text-orange-800' 
                      : task.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {task.status === 'in_progress' ? 'in progress' : task.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          
          {alerts.length > 3 && (
            <div className="pt-3 border-t border-gray-100">
              <Link 
                href="/tasks"
                className="text-purple-600 hover:text-purple-800 text-sm flex items-center justify-center"
              >
                View {alerts.length - 3} more tasks
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          )}
        </div>
      )}
    </StandardCard>
  );
}