"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function CreateCleaningTask() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Create Cleaning Task</h1>
      <p>Task creation form will go here</p>
    </div>
  );
}
