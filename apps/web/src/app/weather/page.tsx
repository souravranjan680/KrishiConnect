"use client";

import { useCallback, useState } from "react";
import {
  CloudSun, MapPin, Navigation, Thermometer, Droplets, Wind,
  CloudRain, Sun, Sunrise, Sunset, AlertTriangle, Info, Loader2, Search,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import VoiceInput from "@/components/VoiceInput";
import { playError, playSuccess, primeSound } from "@/lib/sound";

/* ── types ── */
type DayForecast = {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rain: number;
  humidity: number;
  wind: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
};

type Status = "idle" | "locating" | "fetching" | "success" | "error";

/* weather code → emoji + label */
function weatherIcon(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Clear" };
  if (code <= 3) return { emoji: "⛅", label: "Partly Cloudy" };
  if (code <= 49) return { emoji: "🌫️", label: "Foggy" };
  if (code <= 59) return { emoji: "🌦️", label: "Drizzle" };
  if (code <= 69) return { emoji: "🌧️", label: "Rain" };
  if (code <= 79) return { emoji: "🌨️", label: "Snow" };
  if (code <= 99) return { emoji: "⛈️", label: "Thunderstorm" };
  return { emoji: "☁️", label: "Cloudy" };
}

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

/* advisory logic */
function getAdvisory(day: DayForecast, lang: "en" | "hi") {
  if (day.rain > 5) return { icon: <CloudRain size={16} className="text-blue-500" />, text: t(lang, "weatherAdvRain"), color: "#3b82f6", bg: "#eff6ff" };
  if (day.tempMax > 40) return { icon: <Thermometer size={16} className="text-red-500" />, text: t(lang, "weatherAdvHot"), color: "#ef4444", bg: "#fef2f2" };
  if (day.tempMin < 5) return { icon: <AlertTriangle size={16} className="text-amber-500" />, text: t(lang, "weatherAdvCold"), color: "#f59e0b", bg: "#fffbeb" };
  if (day.wind > 30) return { icon: <Wind size={16} className="text-cyan-500" />, text: t(lang, "weatherAdvWindy"), color: "#06b6d4", bg: "#ecfeff" };
  return { icon: <Sun size={16} className="text-green-500" />, text: t(lang, "weatherAdvGood"), color: "#16a34a", bg: "#f0fdf4" };
}

/* ── geocode via Nominatim ── */
async function geocode(query: string): Promise<{ lat: number; lon: number; display: string } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`,
      { headers: { "User-Agent": "KrishiConnect/1.0" } }
    );
    const data = await r.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name.split(",").slice(0, 2).join(",") };
  } catch { return null; }
}

/* ── reverse geocode via Nominatim ── */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&zoom=12&addressdetails=1`,
      { headers: { "User-Agent": "KrishiConnect/1.0" } }
    );
    const data = await r.json();
    const addr = data?.address ?? {};
    const primary = addr.village || addr.town || addr.city || addr.hamlet || addr.suburb || "";
    const secondary = addr.district || addr.state_district || addr.state || "";
    const composed = [primary, secondary].filter(Boolean).join(", ");
    if (composed) return composed;
    if (typeof data?.display_name === "string") {
      return data.display_name.split(",").slice(0, 2).join(",").trim();
    }
    return null;
  } catch {
    return null;
  }
}

/* ── fetch 7-day forecast from Open-Meteo ── */
async function fetchForecast(lat: number, lon: number): Promise<DayForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max,weather_code,sunrise,sunset&timezone=Asia%2FKolkata&forecast_days=7`;
  const r = await fetch(url);
  const data = await r.json();
  const days: DayForecast[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(data.daily.time[i]);
    days.push({
      date: data.daily.time[i],
      dayName: d.getDay().toString(),
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      rain: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
      humidity: Math.round(data.daily.relative_humidity_2m_max[i]),
      wind: Math.round(data.daily.wind_speed_10m_max[i]),
      weatherCode: data.daily.weather_code[i],
      sunrise: data.daily.sunrise[i]?.split("T")[1] ?? "",
      sunset: data.daily.sunset[i]?.split("T")[1] ?? "",
    });
  }
  return days;
}

export default function WeatherPage() {
  const { lang } = useLanguage();
  const [village, setVillage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [locationName, setLocationName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFetch = useCallback(async (lat?: number, lon?: number, display?: string) => {
    setStatus("fetching");
    setErrorMsg("");
    try {
      let fLat = lat, fLon = lon, fDisplay = display;
      if (fLat === undefined || fLon === undefined) {
        const geo = await geocode(village);
        if (!geo) { playError(); setErrorMsg(t(lang, "weatherError")); setStatus("error"); return; }
        fLat = geo.lat; fLon = geo.lon; fDisplay = geo.display;
      }
      setLocationName(fDisplay ?? village);
      const days = await fetchForecast(fLat, fLon);
      setForecast(days);
      playSuccess();
      setStatus("success");
    } catch {
      playError();
      setErrorMsg(t(lang, "weatherError"));
      setStatus("error");
    }
  }, [village, lang]);

  const handleGps = useCallback(() => {
    primeSound();
    if (!navigator.geolocation) { setErrorMsg(t(lang, "weatherNoGps")); setStatus("error"); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const display = await reverseGeocode(lat, lon);
        const finalDisplay = display || (lang === "hi" ? "GPS लोकेशन" : "GPS Location");
        setVillage(finalDisplay);
        await handleFetch(lat, lon, finalDisplay);
      },
      err => {
        playError();
        setErrorMsg(err.code === 1 ? t(lang, "weatherGpsDenied") : t(lang, "weatherError"));
        setStatus("error");
      },
      { timeout: 15000 }
    );
  }, [handleFetch, lang]);

  const isLoading = status === "locating" || status === "fetching";

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }} className="pt-24 pb-8 sm:pt-32 sm:pb-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-blue-300" />
            {t(lang, "weatherTitle")}
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm">{t(lang, "weatherSub")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Location input */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <label className="flex items-center gap-2 font-bold text-blue-900 mb-3">
            <MapPin size={18} className="text-blue-500" />
            {t(lang, "weatherEnterVillage")}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
              <input
                value={village}
                onChange={e => setVillage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && village.trim() && handleFetch()}
                placeholder={lang === "hi" ? "गाँव का नाम लिखें…" : "Enter village name…"}
                className="w-full pl-9 pr-3 py-3 rounded-2xl border-2 border-blue-200 bg-white text-blue-900 font-semibold outline-none focus:border-blue-500 placeholder:text-blue-300"
                style={{ fontSize: "16px" }}
              />
            </div>
            <VoiceInput lang={lang} onResult={v => { setVillage(v); }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => handleFetch()} disabled={!village.trim() || isLoading}
              className="flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#2563eb" }}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CloudSun size={18} />}
              {status === "fetching" ? t(lang, "weatherFetching") : t(lang, "weatherFetch")}
            </button>
            <button type="button" onClick={handleGps} disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-blue-200 text-blue-700 font-bold hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-40">
              {status === "locating" ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
              {status === "locating" ? t(lang, "weatherLocating") : t(lang, "weatherUseGps")}
            </button>
          </div>
        </div>

        {/* Error */}
        {status === "error" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
            <AlertTriangle size={16} className="text-red-400 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Forecast */}
        {status === "success" && forecast.length > 0 && (
          <>
            <div className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              <MapPin size={14} className="text-blue-400" /> {locationName}
            </div>

            {/* 7-day cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {forecast.map((day, i) => {
                const wI = weatherIcon(day.weatherCode);
                const dayNames = lang === "hi" ? DAY_NAMES_HI : DAY_NAMES_EN;
                const dayIdx = new Date(day.date).getDay();
                const isToday = i === 0;
                return (
                  <div key={day.date}
                    className="rounded-2xl border-2 p-3 sm:p-4 text-center card-animate transition-all hover:shadow-md"
                    style={{
                      borderColor: isToday ? "#2563eb" : "#e5e7eb",
                      background: isToday ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "#fff",
                      animationDelay: `${i * 0.05}s`,
                    }}>
                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isToday ? "#2563eb" : "#9ca3af" }}>
                      {isToday ? t(lang, "weatherToday") : dayNames[dayIdx]}
                    </div>
                    <div className="text-3xl my-2">{wI.emoji}</div>
                    <div className="text-xs text-gray-400 mb-2">{wI.label}</div>
                    <div className="flex justify-center gap-2 text-sm font-extrabold">
                      <span className="text-red-500">{day.tempMax}°</span>
                      <span className="text-blue-400">{day.tempMin}°</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600">
                        <Droplets size={10} /> {day.rain} mm
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-600">
                        <Wind size={10} /> {day.wind} km/h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today's detail card */}
            {forecast[0] && (() => {
              const today = forecast[0];
              const advisory = getAdvisory(today, lang);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Detail stats */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Thermometer size={16} className="text-blue-500" />
                      {t(lang, "weatherToday")} — {lang === "hi" ? "विस्तृत जानकारी" : "Detailed Info"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <Thermometer size={14} className="text-red-400" />, label: t(lang, "weatherTempMax"), value: `${today.tempMax}°C`, color: "#ef4444" },
                        { icon: <Thermometer size={14} className="text-blue-400" />, label: t(lang, "weatherTempMin"), value: `${today.tempMin}°C`, color: "#3b82f6" },
                        { icon: <CloudRain size={14} className="text-blue-500" />, label: t(lang, "weatherRain"), value: `${today.rain} mm`, color: "#2563eb" },
                        { icon: <Droplets size={14} className="text-cyan-500" />, label: t(lang, "weatherHumidity"), value: `${today.humidity}%`, color: "#06b6d4" },
                        { icon: <Wind size={14} className="text-gray-500" />, label: t(lang, "weatherWind"), value: `${today.wind} km/h`, color: "#6b7280" },
                        { icon: <Sunrise size={14} className="text-amber-500" />, label: t(lang, "weatherSunrise"), value: today.sunrise, color: "#f59e0b" },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">{s.icon} {s.label}</div>
                          <div className="text-sm font-extrabold" style={{ color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advisory */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" />
                      {t(lang, "weatherAdvisory")}
                    </h3>
                    <div className="rounded-2xl p-4 border-2" style={{ background: advisory.bg, borderColor: advisory.color + "33" }}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{advisory.icon}</div>
                        <p className="text-sm font-semibold leading-relaxed" style={{ color: advisory.color }}>{advisory.text}</p>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400 font-medium leading-relaxed">
                      💡 {lang === "hi"
                        ? "मौसम के आधार पर अपनी खेती की गतिविधियाँ प्लान करें — बुवाई, सिंचाई, कटाई और स्प्रे का सही समय चुनें।"
                        : "Plan your farming activities based on weather — choose the right time for sowing, irrigation, harvesting and spraying."}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
              <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
              {t(lang, "weatherDisclaimer")}
            </div>
          </>
        )}

        {/* Idle state */}
        {status === "idle" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-4">
              <CloudSun className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">
              {lang === "hi" ? "अपने गाँव का नाम डालें और 7 दिन का मौसम देखें" : "Enter your village name to see 7-day weather forecast"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
