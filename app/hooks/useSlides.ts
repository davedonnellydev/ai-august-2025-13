import { useState, useEffect } from 'react';

// Types based on the RemarkDeckSchema
export interface SlideProperties {
  name: string | null;
  classes: string[];
  layout: boolean;
  template: string | null;
  count: boolean;
  exclude: boolean;
  backgroundImageUrl: string | null;
}

export interface Slide {
  content: string;
  notes: string | null;
  properties: SlideProperties;
  incrementalFromPrevious: boolean;
}

export interface RemarkDeck {
  css: string;
  slides: Slide[];
}

export interface SlidesResponse {
  response: RemarkDeck;
  originalInput: string;
  remainingRequests: number;
}

const STORAGE_KEY = 'ai-slides-cache';
const MAX_CACHE_SIZE = 10; // Maximum number of cached presentations

interface CachedSlide {
  input: string;
  deck: RemarkDeck;
  timestamp: number;
}

export function useSlides(input?: string) {
  const [deck, setDeck] = useState<RemarkDeck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedSlides, setCachedSlides] = useState<CachedSlide[]>([]);

  // Load cached slides from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(
          'useSlides: Loaded cached slides from localStorage:',
          parsed
        );
        setCachedSlides(parsed);
      } else {
        console.log('useSlides: No cached slides found in localStorage');
      }
    } catch (error) {
      console.error('Failed to load cached slides:', error);
    }
  }, []);

  // Save cached slides to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSlides));
      console.log(
        'useSlides: Saved cached slides to localStorage:',
        cachedSlides
      );
    } catch (error) {
      console.error('Failed to save cached slides:', error);
    }
  }, [cachedSlides]);

  // Debug effect to monitor deck state changes
  useEffect(() => {
    console.log('useSlides: Deck state changed:', deck);
  }, [deck]);

  const addToCache = (input: string, deck: RemarkDeck) => {
    const newCachedSlide: CachedSlide = {
      input,
      deck,
      timestamp: Date.now(),
    };

    setCachedSlides((prev) => {
      // Remove existing entry with same input if it exists
      const filtered = prev.filter((item) => item.input !== input);

      // Add new entry at the beginning
      const updated = [newCachedSlide, ...filtered];

      // Keep only the most recent MAX_CACHE_SIZE entries
      return updated.slice(0, MAX_CACHE_SIZE);
    });
  };

  const getFromCache = (input: string): RemarkDeck | null => {
    const cached = cachedSlides.find((item) => item.input === input);
    return cached ? cached.deck : null;
  };

  const clearCache = () => {
    setCachedSlides([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fetchSlides = async (slideInput: string) => {
    setLoading(true);
    setError(null);

    // Check cache first
    const cached = getFromCache(slideInput);
    if (cached) {
      setDeck(cached);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: slideInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch slides');
      }

      const data: SlidesResponse = await response.json();
      const newDeck = data.response;

      // Add to cache
      addToCache(slideInput, newDeck);

      setDeck(newDeck);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (input) {
      fetchSlides(input);
    } else if (cachedSlides.length > 0) {
      // If no input provided, try to load the most recent cached slides
      const mostRecent = cachedSlides[0]; // Most recent is first in the array
      console.log(
        'useSlides: No input provided, loading most recent cached slides:',
        mostRecent
      );
      setDeck(mostRecent.deck);
    } else {
      console.log(
        'useSlides: No input provided and no cached slides available'
      );
    }
  }, [input, cachedSlides]);

  return {
    deck,
    loading,
    error,
    fetchSlides,
    cachedSlides,
    getFromCache,
    clearCache,
    addToCache,
  };
}
