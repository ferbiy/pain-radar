"use client";

import { useEffect, useRef, useState } from "react";

const IMAGES = [
  "/cool-images/1.jpg",
  "/cool-images/2.jpg",
  "/cool-images/3.jpg",
  "/cool-images/4.jpg",
];

interface ImageDividerProps {
  index: number;
}

function selectImage(index: number): string {
  // Deterministic selection based on index
  const seed = index * 3 + 7;
  const shuffled = [...IMAGES].sort(
    (a, b) => ((a.charCodeAt(0) + seed) % 13) - ((b.charCodeAt(0) + seed) % 13)
  );

  return shuffled[index % shuffled.length];
}

export function ImageDivider({ index }: ImageDividerProps) {
  const selectedImage = selectImage(index);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Randomly vary the height for each image divider
  const heightVariants = [
    "h-[250px] md:h-[400px]",
    "h-[350px] md:h-[500px]",
    "h-[300px] md:h-[600px]",
  ];
  const heightClass = heightVariants[index % heightVariants.length];

  // Intersection observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollProgress =
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (scrollProgress - 0.5) * 50; // Subtle parallax movement

      setParallaxOffset(offset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden bg-muted/20 transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      }`}
    >
      <div className={`relative w-full ${heightClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selectedImage}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-105"
          style={{
            transform: `translateY(${parallaxOffset}px)`,
          }}
        />
        {/* Subtle overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20" />
      </div>
    </div>
  );
}
