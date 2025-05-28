"use client";

import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import { useAuth } from "@/components/AuthProvider";
import { UserCircleIcon } from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedPageWrapper>
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <UserCircleIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.email}</h2>
                <p className="text-gray-600">Account Member</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-medium mb-2">Account Information</h3>
              <p className="text-gray-600">Email: {user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPageWrapper>
  );
}
