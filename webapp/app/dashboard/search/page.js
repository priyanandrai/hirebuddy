"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchTasks, searchHelpers } from "../../components/services/search.service";

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    if (!q) return;
    let mounted = true;
    setLoading(true);
    Promise.all([searchTasks(q, 20), searchHelpers(q, 20)])
      .then(([tRes, hRes]) => {
        if (!mounted) return;
        setTasks(tRes.tasks || []);
        setTotalTasks(tRes.total || 0);
        setHelpers(hRes.helpers || []);
      })
      .catch((err) => {
        console.error("Search error", err);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [q]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="mb-4 text-2xl font-semibold">Search results for "{q}"</h1>

      {loading && <p>Loading…</p>}

      {!loading && (
        <>
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-medium">Tasks ({totalTasks})</h2>
            {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks found.</p>}
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                  <a href={`/dashboard/my-tasks/${task.id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400">{task.title}</a>
                  <p className="text-xs text-slate-500">{task.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium">Helpers ({helpers.length})</h2>
            {helpers.length === 0 && <p className="text-sm text-slate-500">No helpers found.</p>}
            <ul className="space-y-3">
              {helpers.map((h) => (
                <li key={h.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                  <a href={`/dashboard/helpers/${h.id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400">{h.name || h.displayName || 'Helper'}</a>
                  <p className="text-xs text-slate-500">{h.services?.join(', ')}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
