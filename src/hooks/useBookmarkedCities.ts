"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// Shared Firestore collection name
const BOOKMARKS_COLLECTION = "bookmarkedCities";

export function useBookmarkedCities() {
  const [bookmarkedCities, setBookmarkedCities] = useState<string[]>([]);

  // 🔹 Listen to changes from Firestore in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, BOOKMARKS_COLLECTION), (snap) => {
      const cities = snap.docs.map((d) => d.id);
      setBookmarkedCities(cities);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Add a city to Firestore (creates document)
  const addCity = async (city: string) => {
    if (!city) return;
    try {
      await setDoc(doc(db, BOOKMARKS_COLLECTION, city), {
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error adding city:", err);
    }
  };

  // 🔹 Remove a city from Firestore
  const removeCity = async (city: string) => {
    try {
      await deleteDoc(doc(db, BOOKMARKS_COLLECTION, city));
    } catch (err) {
      console.error("Error removing city:", err);
    }
  };

  return { bookmarkedCities, addCity, removeCity };
}
