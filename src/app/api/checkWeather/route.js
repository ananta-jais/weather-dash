// app/api/checkWeather/route.js
import axios from "axios";
import { NextResponse } from "next/server";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // adjust if path differs

// Function to detect alerts from weather conditions
function detectAlertFromWeather(data) {
  const weather = data.weather?.[0]?.main?.toLowerCase() || "";
  const windSpeed = data.wind?.speed || 0;
  const temp = data.main?.temp - 273.15; // Kelvin → °C

  if (weather.includes("rain")) return "⚠️ Rain expected — stay alert!";
  if (weather.includes("storm")) return "⛈️ Storm conditions — take precautions!";
  if (windSpeed > 10) return "💨 High wind speeds detected — be cautious!";
  if (temp > 40) return "🔥 Heatwave conditions possible!";
  if (temp < 0) return "❄️ Cold wave warning!";
  return null;
}

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OpenWeather API key" },
        { status: 500 }
      );
    }

    // 🔹 Fetch bookmarked cities from Firestore
    const citiesSnap = await getDocs(collection(db, "bookmarkedCities"));
    const cities = citiesSnap.docs.map((doc) => doc.id);

    if (cities.length === 0) {
      console.log("No bookmarked cities to check.");
      return NextResponse.json({ status: "no cities" });
    }

    console.log("🌍 Checking cities:", cities);
    const alertsLogged = [];

    // 🔹 Loop through all bookmarked cities and check weather
    for (const city of cities) {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}`;

      const res = await axios.get(url);
      const data = res.data;
      const alertMsg = detectAlertFromWeather(data);

      console.log("➡️ Weather:", data.weather?.[0]?.main, "| Alert:", alertMsg);

      if (alertMsg) {
        // Write alert to Firestore
        await addDoc(collection(db, "alerts"), {
          city,
          message: alertMsg,
          timestamp: new Date().toISOString(),
        });
        alertsLogged.push({ city, message: alertMsg });
      }
    }

    return NextResponse.json({ status: "ok", alerts: alertsLogged });
  } catch (err) {
    console.error("checkWeather error:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
