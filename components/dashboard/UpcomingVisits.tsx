"use client";

import StandardCard from "@/components/ui/StandardCard";
import { Calendar, Clock, User, ExternalLink } from "lucide-react";
import Link from "next/link";

interface UpcomingVisitsProps {
  visits: any[];
  onAddReservation: () => void;
  loading?: boolean; // ✅ Add this
}

export default function UpcomingVisits({
  visits,
  onAddReservation,
  loading = false,
}: UpcomingVisitsProps) {
  if (loading) {
    return (
      <StandardCard className="h-fit">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </StandardCard>
    );
  }

  return (
    <StandardCard className="h-fit">
      <div className="flex items-center justify-between mb-4">
        {/* Clickable header */}
        <Link
          href="/calendar"
          className="text-lg font-semibold text-gray-900 flex items-center hover:text-blue-600 transition-colors group"
        >
          <Calendar className="h-5 w-5 mr-2 group-hover:text-blue-600" />
          Upcoming Visits
          <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <button
          onClick={onAddReservation}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Add Visit
        </button>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No upcoming visits</p>
          <Link
            href="/calendar"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            View full calendar
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <Link
              key={visit.id}
              href={`/calendar?reservation=${visit.id}`}
              className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {visit.guest_name}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(visit.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    visit.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {visit.status}
                </span>
              </div>
            </Link>
          ))}

          {/* View all link */}
          <div className="pt-3 border-t border-gray-100">
            <Link
              href="/calendar"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center"
            >
              View all in calendar
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </StandardCard>
  );
}
