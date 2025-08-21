'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container, Title, Text, Paper, Button, Group, Stack, LoadingOverlay, Alert, Select, ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconPresentation, IconTrash, IconRefresh, IconHistory } from '@tabler/icons-react';
import Link from 'next/link';
import { useSlides, RemarkDeck } from '../hooks/useSlides';

export default function SlidesPage() {
  const slideshowRef = useRef<HTMLDivElement>(null);
  const remarkRef = useRef<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCachedInput, setSelectedCachedInput] = useState<string | null>(null);
  
  const { deck, loading, error, cachedSlides, getFromCache, clearCache } = useSlides();

  // Use the selected cached deck or the fetched deck
  const activeDeck = deck || (selectedCachedInput ? getFromCache(selectedCachedInput) : null);

  // Debug logging
  useEffect(() => {
    console.log('SlidesPage: deck state:', deck);
    console.log('SlidesPage: selectedCachedInput:', selectedCachedInput);
    console.log('SlidesPage: activeDeck:', activeDeck);
    console.log('SlidesPage: cachedSlides count:', cachedSlides.length);
  }, [deck, selectedCachedInput, activeDeck, cachedSlides]);

  useEffect(() => {
    // Dynamically load remarkjs
    const loadRemark = async () => {
      try {
        // Check if remark is already loaded
        if (window.remark) {
          if (activeDeck) {
            initializeSlideshow();
          }
          return;
        }

        // Load remarkjs script
        const script = document.createElement('script');
        script.src = 'https://remarkjs.com/downloads/remark-latest.min.js';
        script.onload = () => {
          if (window.remark && activeDeck) {
            initializeSlideshow();
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load remarkjs:', error);
      }
    };

    const initializeSlideshow = () => {
      if (!window.remark || !slideshowRef.current || !activeDeck) return;

      // Create the markdown content
      const markdownContent = createMarkdownContent(activeDeck);
      
      // Set the content
      if (slideshowRef.current) {
        slideshowRef.current.innerHTML = `<textarea id="source">${markdownContent}</textarea>`;
      }

      // Initialize remark
      try {
        remarkRef.current = window.remark.create({
          sourceUrl: '#source',
          highlightStyle: 'github',
          highlightLines: true,
          highlightSpans: true,
          countIncrementalSlides: false,
        });

        // Add event listeners for slide navigation
        if (remarkRef.current) {
          remarkRef.current.on('showSlide', (slide: any) => {
            setCurrentSlide(slide.getSlideIndex());
          });
        }
      } catch (error) {
        console.error('Failed to initialize remark:', error);
      }
    };

    loadRemark();
  }, [activeDeck]);

  const createMarkdownContent = (deck: RemarkDeck): string => {
    let markdown = '';
    
    deck.slides.forEach((slide, index) => {
      if (slide.properties.exclude) return;
      
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
      markdown += `\n${slide.content}\n`;
      
      // Add slide notes if they exist
      if (slide.notes) {
        markdown += `\n???\n${slide.notes}\n`;
      }
      
      // Add slide separator (unless it's the last slide)
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

  const navigateToSlide = (direction: 'prev' | 'next' | 'first' | 'last') => {
    if (!remarkRef.current) return;
    
    switch (direction) {
      case 'prev':
        remarkRef.current.prev();
        break;
      case 'next':
        remarkRef.current.next();
        break;
      case 'first':
        remarkRef.current.gotoSlide(1);
        break;
      case 'last':
        remarkRef.current.gotoSlide(activeDeck?.slides.length || 1);
        break;
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Auto-advance slides every 5 seconds when playing
    if (!isPlaying) {
      const interval = setInterval(() => {
        if (remarkRef.current && isPlaying) {
          remarkRef.current.next();
        }
      }, 5000);
      
      // Cleanup interval when component unmounts or playing stops
      return () => clearInterval(interval);
    }
  };

  const handleCachedInputChange = (value: string | null) => {
    setSelectedCachedInput(value);
    if (value) {
      const cachedDeck = getFromCache(value);
      if (cachedDeck) {
        // Force re-initialization of slideshow with new deck
        if (remarkRef.current) {
          remarkRef.current = null;
        }
        if (slideshowRef.current) {
          slideshowRef.current.innerHTML = '';
        }
      }
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group>
            <Link href="/" passHref>
              <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}>
                Back to Home
              </Button>
            </Link>
          </Group>
          <Group>
            <IconPresentation size={24} />
            <Title order={1} size="h2">Slides Presentation</Title>
          </Group>
          <Group>
            <Link href="/slides/demo" passHref>
              <Button variant="outline" size="sm">
                View Demo
              </Button>
            </Link>
          </Group>
        </Group>

        {/* Cache Management */}
        {cachedSlides.length > 0 && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group>
                  <IconHistory size={20} />
                  <Title order={4} size="h5">Cached Presentations</Title>
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
              
              <Select
                placeholder="Select a cached presentation to view..."
                value={selectedCachedInput}
                onChange={handleCachedInputChange}
                data={cachedSlides.map(item => ({
                  value: item.input,
                  label: `${item.input.substring(0, 50)}${item.input.length > 50 ? '...' : ''} (${formatTimestamp(item.timestamp)})`
                }))}
                searchable
                clearable
                maxDropdownHeight={200}
                style={{ flex: 1 }}
              />
              
              <Text size="xs" c="dimmed">
                {cachedSlides.length} presentation(s) cached. Select one above to view, or generate new slides from the home page.
              </Text>
            </Stack>
          </Paper>
        )}

        {/* Instructions */}
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed">
            {cachedSlides.length > 0 
              ? "Select a cached presentation above, or use the navigation controls below to browse slides. Use the arrow keys or click the navigation buttons to navigate through the slides. Press 'F' for fullscreen, 'P' for presenter mode, and 'C' to open presenter console."
              : "No cached presentations found. Go to the home page to generate new slides. Use the arrow keys or click the navigation buttons to navigate through the slides. Press 'F' for fullscreen, 'P' for presenter mode, and 'C' to open presenter console."
            }
          </Text>
        </Paper>

        {/* Slide Navigation Controls */}
        {activeDeck && (
          <Paper p="md" withBorder>
            <Group justify="center" gap="xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToSlide('first')}
                leftSection={<IconArrowLeft size={16} />}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToSlide('prev')}
                leftSection={<IconArrowLeft size={16} />}
              >
                Previous
              </Button>
              <Button
                variant={isPlaying ? 'filled' : 'outline'}
                size="sm"
                onClick={togglePlayPause}
                leftSection={isPlaying ? <IconRefresh size={16} /> : <IconRefresh size={16} />}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToSlide('next')}
                rightSection={<IconArrowLeft size={16} style={{ transform: 'scaleX(-1)' }} />}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToSlide('last')}
                rightSection={<IconArrowLeft size={16} style={{ transform: 'scaleX(-1)' }} />}
              >
                Last
              </Button>
            </Group>
            <Text size="sm" c="dimmed" ta="center" mt="xs">
              Slide {currentSlide + 1} of {activeDeck.slides.filter(s => !s.properties.exclude).length}
            </Text>
          </Paper>
        )}

        {/* Slideshow Container */}
        <Paper withBorder pos="relative">
          <LoadingOverlay visible={loading} />
          <div 
            ref={slideshowRef}
            style={{ 
              minHeight: '600px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {!activeDeck ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <IconPresentation size={48} style={{ opacity: 0.5 }} />
                <Text size="lg" c="dimmed" mt="md">
                  {cachedSlides.length > 0 
                    ? "Select a cached presentation above to view slides"
                    : "No presentations available. Go to the home page to generate new slides."
                  }
                </Text>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Text size="lg" c="dimmed">Loading slides...</Text>
              </div>
            )}
          </div>
        </Paper>

        {/* Custom CSS Injection */}
        {activeDeck && (
          <style dangerouslySetInnerHTML={{ __html: activeDeck.css }} />
        )}
      </Stack>
    </Container>
  );
}

// Extend Window interface for remark
declare global {
  interface Window {
    remark: any;
  }
}
