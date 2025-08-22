'use client';

import { useEffect, useState } from 'react';
import { Button, Text, TextInput, Title, Paper, Group, Stack, Badge, Code, Alert, Select, ActionIcon, Tooltip } from '@mantine/core';
import { IconPresentation, IconExternalLink, IconCopy, IconCheck, IconHistory, IconTrash, IconInfoCircle } from '@tabler/icons-react';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';
import Link from 'next/link';

// Types for the slide data
interface SlideProperties {
  name: string | null;
  classes: string[];
  layout: boolean;
  template: string | null;
  count: boolean;
  exclude: boolean;
  backgroundImageUrl: string | null;
}

interface Slide {
  content: string;
  notes: string | null;
  properties: SlideProperties;
  incrementalFromPrevious: boolean;
}

interface RemarkDeck {
  css: string;
  slides: Slide[];
}

const STORAGE_KEY = 'ai-slides-cache';

interface CachedSlide {
  input: string;
  deck: RemarkDeck;
  timestamp: number;
}

export function SlideInput() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);
  const [cachedSlides, setCachedSlides] = useState<CachedSlide[]>([]);

  // Update remaining requests on component mount and after translations
  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
    loadCachedSlides();
  }, []);

  // Debug effect to monitor cachedSlides state changes
  useEffect(() => {
    console.log('cachedSlides state changed:', cachedSlides);
  }, [cachedSlides]);

  const loadCachedSlides = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      console.log('Loading cached slides from localStorage:', cached);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log('Parsed cached slides:', parsed);
        setCachedSlides(parsed);
      } else {
        console.log('No cached slides found in localStorage');
      }
    } catch (error) {
      console.error('Failed to load cached slides:', error);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCachedSlides([]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const deletePresentation = (input: string) => {
    try {
      setCachedSlides(prev => {
        // Filter out the presentation with the matching input
        const updated = prev.filter(item => item.input !== input);
        
        // Save updated list to localStorage
        if (updated.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
          // If no presentations left, remove the key entirely
          localStorage.removeItem(STORAGE_KEY);
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete presentation:', error);
    }
  };

  const addToCache = (input: string, deck: RemarkDeck) => {
    console.log('Adding to cache - input:', input);
    console.log('Adding to cache - deck slides count:', deck.slides?.length);
    
    if (!input || !deck) {
      console.error('Invalid input or deck for caching:', { input, deck });
      return;
    }
    
    const newCachedSlide: CachedSlide = {
      input,
      deck,
      timestamp: Date.now(),
    };

    console.log('Creating cached slide object:', newCachedSlide);

    setCachedSlides(prev => {
      console.log('Previous cached slides:', prev);
      
      // Remove existing entry with same input if it exists
      const filtered = prev.filter(item => item.input !== input);
      console.log('Filtered slides (removed duplicates):', filtered);
      
      // Add new entry at the beginning
      const updated = [newCachedSlide, ...filtered];
      console.log('Updated slides list:', updated);
      
      // Keep only the most recent 10 entries
      const maxCacheSize = 10;
      const final = updated.slice(0, maxCacheSize);
      console.log('Final slides list (after size limit):', final);
      
      // Save to localStorage
      try {
        const serialized = JSON.stringify(final);
        console.log('Serialized data length:', serialized.length);
        localStorage.setItem(STORAGE_KEY, serialized);
        console.log('Successfully saved to localStorage with key:', STORAGE_KEY);
        
        // Verify it was saved
        const verification = localStorage.getItem(STORAGE_KEY);
        console.log('Verification - data retrieved from localStorage:', verification ? 'Data found' : 'No data found');
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
      
      return final;
    });
  };

  const handleRequest = async () => {
    if (!input.trim()) {
      setError('Please enter some text to translate');
      return;
    }

    // Check rate limit before proceeding
    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || 'API call failed');
      }
      const result = await response.json();
      console.log('API response result:', result);
      console.log('Input text:', input);
      console.log('Response deck:', result.response);
      
      // Cache the newly generated slides
      addToCache(input, result.response);

      // Clear the input after successful generation
      setInput('');

      // Update remaining requests after successful translation
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());
    } catch (err) {
      console.error('API error:', err);
      setError(err instanceof Error ? err.message : 'API failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setError('');
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const isNewPresentation = (timestamp: number): boolean => {
    // Consider presentations generated in the last 5 minutes as "new"
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return timestamp > fiveMinutesAgo;
  };

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: '20px' }}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Title order={1} size="h2">AI Slide Generator</Title>
          <Link href="/slides/demo" passHref>
            <Button 
              variant="filled" 
              color="grape"
              leftSection={<IconPresentation size={16} />}
            >
              View Demo
            </Button>
          </Link>
        </Group>

        {/* Explainer Section */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group>
              <IconInfoCircle size={20} color="#228be6" />
              <Title order={4} size="h5">How to Use</Title>
            </Group>
            <Text size="sm">
              Generate AI-powered slide presentations by describing your topic below. Once generated, 
              presentations are automatically saved and can be viewed anytime.
            </Text>
            
            <Paper p="sm" withBorder bg="#f8f9fa">
              <Stack gap="xs">
                <Text size="sm" fw={500}>Presentation Controls:</Text>
                <Text size="xs" c="dimmed">
                  • <strong>Arrow keys</strong> or <strong>Space</strong> - Navigate between slides<br/>
                  • <strong>F</strong> - Fullscreen mode<br/>
                  • <strong>P</strong> - Presenter mode<br/>
                  • <strong>C</strong> - Clone display<br/>
                  • <strong>H</strong> - Return to home page
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        {/* Input Section */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <TextInput
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              size="md"
              radius="md"
              label="Describe your slides"
              placeholder="e.g., Create slides about the benefits of renewable energy"
              onKeyPress={(e) => e.key === 'Enter' && handleRequest()}
            />

            <Group>
              <Button
                variant="filled"
                color="cyan"
                onClick={() => handleRequest()}
                loading={isLoading}
                leftSection={<IconPresentation size={16} />}
              >
                Generate Slides
              </Button>
              <Button variant="light" color="cyan" onClick={() => handleReset()}>
                Reset
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Generated Presentations */}
        {cachedSlides.length > 0 && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group>
                  <IconHistory size={20} />
                  <Title order={4} size="h5">Generated Presentations</Title>
                </Group>
                <Tooltip label="Clear all presentations">
                  <ActionIcon 
                    variant="outline" 
                    color="red" 
                    onClick={clearCache}
                    size="sm"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              
              <Stack gap="xs">
                {cachedSlides.map((item, index) => (
                  <Paper key={index} p="sm" withBorder>
                    <Group justify="space-between" align="center">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group gap="xs" align="center">
                          <Text size="sm" fw={500} lineClamp={1}>
                            {item.input}
                          </Text>
                          {isNewPresentation(item.timestamp) && (
                            <Badge color="green" size="xs">New</Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          Generated: {formatTimestamp(item.timestamp)} • {item.deck.slides.filter(s => !s.properties.exclude).length} slides
                        </Text>
                      </Stack>
                                              <Group gap="xs">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            color='red'
                            onClick={() => deletePresentation(item.input)}
                          >
                            Delete
                          </Button>
                          <Link href="/slides" passHref>
                            <Button variant="light" size="sm">
                              View
                            </Button>
                          </Link>
                        </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Rate Limit Info */}
        <Text c="dimmed" ta="center" size="sm">
          You have {remainingRequests} slide-pack generations remaining.
        </Text>
      </Stack>
    </div>
  );
}
