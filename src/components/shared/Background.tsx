"use client";

import React, { useEffect, useRef } from 'react';

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const Background = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createChar = () => {
      const char = document.createElement('span');
      char.classList.add('matrix-char');
      char.style.left = `${Math.random() * 100}vw`;
      char.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5-10 seconds
      char.style.animationDelay = `${Math.random() * 5}s`;
      char.style.fontSize = `${Math.random() * 10 + 8}px`; // 8px to 18px
      char.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
      container.appendChild(char);

      // Remove the element after animation to prevent DOM overflow
      setTimeout(() => {
        char.remove();
      }, 10000); // Should be same as max animation duration
    };

    const intervalId = setInterval(createChar, 100); // Create a new char every 100ms

    return () => clearInterval(intervalId);
  }, []);

  return <div id="matrix-bg" ref={containerRef}></div>;
};
