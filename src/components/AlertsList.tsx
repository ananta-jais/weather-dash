"use client";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Alert {
  id: string;
  city: string;
  message: string;
  timestamp: number;
}

export default function AlertsList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "alerts"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    // 🔄 Real-time Firestore listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      })) as Alert[];
      setAlerts(items);
    });

    // ✅ Clean up listener when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">⚠️ Recent Weather Alerts</h2>
      {alerts.length === 0 ? (
        <p className="text-gray-400">No alerts yet.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="border border-gray-700 rounded-lg p-3 bg-gray-800"
            >
              <p className="text-lg">{a.message}</p>
              <p className="text-sm text-gray-400">
                📍 {a.city} — {new Date(a.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

