"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [shouldRender, setShouldRender] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "Luvenex";

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("luvenex_splash_shown");
    if (alreadyShown) {
      setShouldRender(false);
      return;
    }
    sessionStorage.setItem("luvenex_splash_shown", "true");

    // type one letter at a time
    let index = 0;
    const typeInterval = setInterval(() => {
      index++;
      setTypedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(typeInterval);
      }
    }, 180);

    // blink the cursor continuously
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 450);

    // start fade-out after typing finishes + a longer pause
    const fadeTimer = setTimeout(() => setFadeOut(true), 3000);
    const removeTimer = setTimeout(() => setShouldRender(false), 3500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-mono font-bold text-white tracking-tight">
        {typedText.split("").map((char, i) =>
          char.toLowerCase() === "e" && i === 3 ? (
            <span key={i} className="text-[#B90808]">{char}</span>
          ) : (
            <span key={i}>{char}</span>
          )
        )}
        <span
          className={`inline-block w-[3px] sm:w-[4px] h-8 sm:h-12 md:h-14 bg-[#B90808] ml-1 align-middle transition-opacity duration-100 ${
            showCursor ? "opacity-100" : "opacity-0"
          }`}
        />
      </h1>
    </div>
  );
}