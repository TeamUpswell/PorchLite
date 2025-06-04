"use client";

import { useState } from "react";
import StandardCard from "@/components/ui/StandardCard";
import { AlertTriangle, Package, Eye, EyeOff, ExternalLink } from "lucide-react";
import Link from "next/link";

interface InventoryAlertsProps {
  alerts: any[];
}

export default function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);

  return (
    <StandardCard className="h-fit">
      <div className="flex items-center justify-between mb-4">
        {/* Clickable header */}
        <Link
          href="/inventory?filter=alerts"
          className="text-lg font-semibold text-gray-900 flex items-center hover:text-yellow-600 transition-colors group"
        >
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500 group-hover:text-yellow-600" />
          Inventory Alerts
          <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/inventory"
          className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
        >
          View All
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No inventory alerts</p>
          <Link
            href="/inventory"
            className="text-yellow-600 hover:text-yellow-800 text-sm underline"
          >
            View all inventory
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedAlerts.map((item) => (
              <Link
                key={item.id}
                href={`/inventory?item=${item.id}`}
                className="block border border-yellow-200 rounded-lg p-3 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} | Status: {item.status}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {item.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {alerts.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {showAll ? (
                <EyeOff className="h-4 w-4 mr-1" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )}
              {showAll ? "Show Less" : `Show ${alerts.length - 5} More`}
            </button>
          )}
        </>
      )}
    </StandardCard>
  );
}
