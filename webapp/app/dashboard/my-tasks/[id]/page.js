"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById } from "@/app/components/services/task.service";


export default function TaskDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ( !id) return;

    getTaskById(id)
      .then(setTask)
      .finally(() => setLoading(false));
  }, [id, session, router]);

  if (loading) return <p className="p-6">Loading task...</p>;
  if (!task) return <p className="p-6">Task not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{task.title}</h1>

      <div className="rounded-lg border bg-white p-5 space-y-3">
        <p className="text-sm text-gray-600">
          <strong>Category:</strong> {task.category}
        </p>

        <p className="text-sm text-gray-600">
          <strong>Description:</strong>{" "}
          {task.description || "No description"}
        </p>

        <p className="text-sm text-gray-600">
          <strong>Location:</strong> {task.location}
        </p>

        <p className="text-sm text-gray-600">
          <strong>Budget:</strong> ₹{task.budget}
        </p>

        <p className="text-sm text-gray-600">
          <strong>Status:</strong> {task.status}
        </p>

        <p className="text-sm text-gray-600">
          <strong>Created:</strong>{" "}
          {new Date(task.createdAt).toLocaleString()}
        </p>

        {task.assignedTo ? (
          <p className="text-sm text-green-600">
            <strong>Assigned to:</strong> {task.assignedTo.name}
          </p>
        ) : (
          <p className="text-sm text-yellow-600">
            <strong>Helper:</strong> Not assigned yet
          </p>
        )}
      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 text-sm text-green-600 hover:underline"
      >
        ← Back to My Tasks
      </button>
    </div>
  );
}
