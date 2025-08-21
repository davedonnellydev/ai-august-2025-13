'use client';

import { useEffect, useState } from 'react';
import { Button, Text, TextInput, Title, Paper, Group, Stack, Badge, Code, Alert, Select, ActionIcon, Tooltip } from '@mantine/core';
import { IconPresentation, IconExternalLink, IconCopy, IconCheck, IconHistory, IconTrash } from '@tabler/icons-react';
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
  const [response, setResponse] = useState<RemarkDeck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);
  const [copied, setCopied] = useState(false);
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
      
      setResponse(result.response);

      // Cache the newly generated slides
      addToCache(input, result.response);

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
    setResponse(null);
    setError('');
  };

  const copyToClipboard = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: '20px' }}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Title order={1} size="h2">AI Slide Generator</Title>
          <Link href="/slides" passHref>
            <Button 
              variant="outline" 
              leftSection={<IconPresentation size={16} />}
              rightSection={<IconExternalLink size={16} />}
            >
              View Slides
            </Button>
          </Link>
        </Group>

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

        {/* Cached Presentations */}
        {cachedSlides.length > 0 && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group>
                  <IconHistory size={20} />
                  <Title order={4} size="h5">Recently Generated Presentations</Title>
                </Group>
                <Tooltip label="Clear all cached presentations">
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
                {cachedSlides.slice(0, 3).map((item, index) => (
                  <Paper key={index} p="sm" withBorder>
                    <Group justify="space-between" align="center">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {item.input}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Generated: {formatTimestamp(item.timestamp)} • {item.deck.slides.filter(s => !s.properties.exclude).length} slides
                        </Text>
                      </Stack>
                      <Link href="/slides" passHref>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </Group>
                  </Paper>
                ))}
              </Stack>
              
              {cachedSlides.length > 3 && (
                <Text size="xs" c="dimmed" ta="center">
                  And {cachedSlides.length - 3} more... Visit the slides page to see all cached presentations.
                </Text>
              )}
            </Stack>
          </Paper>
        )}

        {/* Response Display */}
        {response && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3} size="h4">Generated Slides</Title>
                <Group gap="xs">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  >
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </Button>
                  <Link href="/slides" passHref>
                    <Button
                      variant="filled"
                      size="sm"
                      leftSection={<IconPresentation size={16} />}
                    >
                      View Presentation
                    </Button>
                  </Link>
                </Group>
              </Group>

              {/* Slide Summary */}
              <Paper p="sm" withBorder>
                <Group gap="md">
                  <Badge color="blue" variant="light">
                    {response.slides.filter(s => !s.properties.exclude).length} slides
                  </Badge>
                  {response.slides.some(s => s.properties.classes.includes('center')) && (
                    <Badge color="green" variant="light">Centered slides</Badge>
                  )}
                  {response.slides.some(s => s.notes) && (
                    <Badge color="purple" variant="light">Speaker notes</Badge>
                  )}
                  {response.css && (
                    <Badge color="orange" variant="light">Custom styling</Badge>
                  )}
                </Group>
              </Paper>

              {/* First Slide Preview */}
              {response.slides.length > 0 && (
                <Paper p="sm" withBorder>
                  <Text size="sm" fw={500} mb="xs">First Slide Preview:</Text>
                  <Code block>
                    {response.slides[0].content.substring(0, 200)}
                    {response.slides[0].content.length > 200 ? '...' : ''}
                  </Code>
                </Paper>
              )}

              {/* CSS Preview */}
              {response.css && (
                <Paper p="sm" withBorder>
                  <Text size="sm" fw={500} mb="xs">Custom CSS:</Text>
                  <Code block>
                    {response.css.substring(0, 300)}
                    {response.css.length > 300 ? '...' : ''}
                  </Code>
                </Paper>
              )}

              {/* Cache Info */}
              <Alert color="green" title="Cached Successfully">
                These slides have been automatically cached and can be viewed later without regenerating them from the AI.
              </Alert>
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
