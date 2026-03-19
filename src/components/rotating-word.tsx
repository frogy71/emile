"use client";

import { useEffect, useState } from "react";

const WORDS = [
  { text: "associations", color: "bg-[#c8f76f]" },
  { text: "ONG", color: "bg-[#ffe066]" },
  { text: "porteurs de projets", color: "bg-[#ffa3d1]" },
  { text: "collectivités", color: "bg-[#a3d5ff]" },
  { text: "entreprises sociales", color: "bg-[#d4b5ff]" },
];

export function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length);
        setVisible(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const word = WORDS[index];

  return (
    <span
      className={`${word.color} px-3 py-1 rounded-xl border-2 border-border shadow-[3px_3px_0px_0px_#1a1a1a] inline-block transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {word.text}
    </span>
  );
}
