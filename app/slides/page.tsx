'use client';

import React, { useEffect, useRef } from 'react';
import { useSlides } from '../hooks/useSlides';
import { useRouter } from 'next/navigation';

export default function SlidesPage() {
  const { deck, loading } = useSlides();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (deck && textareaRef.current) {
      // Create markdown content from the deck
      const markdownContent = createMarkdownContent(deck);
      textareaRef.current.value = markdownContent;

      // Initialize remark.js
      initializeRemark();
    }
  }, [deck]);

  useEffect(() => {
    // Add keyboard event listener for navigation back to home
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if 'H' key is pressed (case insensitive)
      if (event.key.toLowerCase() === 'h') {
        router.push('/');
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [router]);

  const createMarkdownContent = (deck: any): string => {
    let markdown = '';

    deck.slides.forEach((slide: any, index: number) => {
      if (slide.properties.exclude) {
        return;
      }

      // Add slide properties
      if (slide.properties.name) {
        markdown += `name: ${slide.properties.name}\n`;
      }

      if (slide.properties.classes.length > 0) {
        markdown += `class: ${slide.properties.classes.join(', ')}\n`;
      }

      if (slide.properties.backgroundImageUrl) {
        markdown += `background-image: url(${slide.properties.backgroundImageUrl})\n`;
      }

      if (!slide.properties.count) {
        markdown += `count: false\n`;
      }

      if (slide.properties.layout) {
        markdown += `layout: true\n`;
      }

      if (slide.properties.template) {
        markdown += `template: ${slide.properties.template}\n`;
      }

      // Add slide content
      let cleanContent = slide.content;
      cleanContent = cleanContent.replace(/^class:\s*[^\n]+\n?/gm, '');
      cleanContent = cleanContent.replace(/^\n+/, '');

      markdown += `\n${cleanContent}\n`;

      // Add slide notes if they exist
      if (slide.notes) {
        markdown += `\n???\n${slide.notes}\n`;
      }

      // Add slide separator
      if (index < deck.slides.length - 1) {
        const nextSlide = deck.slides[index + 1];
        if (nextSlide.incrementalFromPrevious) {
          markdown += `\n--\n\n`;
        } else {
          markdown += `\n---\n\n`;
        }
      }
    });

    return markdown;
  };

  const initializeRemark = () => {
    // Load remark.js script
    const script = document.createElement('script');
    script.src = 'https://remarkjs.com/downloads/remark-latest.min.js';
    script.onload = () => {
      if (window.remark) {
        window.remark.create();
      }
    };
    document.head.appendChild(script);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading slides...
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        No slides available. Go to the home page to generate new slides.
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: deck.css }} />

      {/* Simple textarea for remark.js */}
      <textarea id="source" ref={textareaRef} style={{ display: 'none' }}>
        {createMarkdownContent(deck)}
      </textarea>
    </>
  );
}

// Extend Window interface for remark
declare global {
  interface Window {
    remark: any;
  }
}
