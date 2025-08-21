'use client';

import React, { useEffect, useRef } from 'react';
import { Container, Title, Text, Paper, Button, Group, Stack } from '@mantine/core';
import { IconArrowLeft, IconPresentation } from '@tabler/icons-react';
import Link from 'next/link';

// Demo slide data
const demoDeckData = {
  "css": `
    .remark-slide-content { 
      font-family: 'Comic Sans MS', 'Comic Sans', cursive; 
      background: #fffbe7; 
    }
    h1, h2 { 
      color: #6a3d9a; 
      text-shadow: 2px 2px #e0c3fc; 
    }
    ul { 
      font-size: 1.2em; 
    }
    .woof { 
      color: #ff9800; 
      font-weight: bold; 
    }
    .poodley { 
      color: #1e88e5; 
      font-style: italic; 
    }
    img.spoodle { 
      width: 280px; 
      border-radius: 30px; 
      border: 4px dashed #a0d4f1; 
      margin: 15px 0; 
      box-shadow: 2px 4px 12px #cfcfcf; 
    }
    blockquote { 
      font-size:1.2em; 
      color:#c2185b; 
    }
    .remark-slide-content.center { 
      text-align: center; 
    }
  `,
  "slides": [
    {
      "content": "class: center, middle\n\n# 🐶 Meet The Spoodle!\n\n.poodley[Part Poodle. Part Cocker Spaniel.]\n\nAll floof. No brakes.",
      "notes": "Opening slide, set a light-hearted vibe. Define \"spoodle\" and use playful language.",
      "properties": {
        "name": "title",
        "classes": ["center", "middle"],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "# What *is* a Spoodle?\n\n- AKA: Cockapoo, Cockerpoo, or \"Designer Shed-Confetti Machine\"\n- A cocktail of Cocker Spaniel and Poodle\n- Has more energy than your internet before 2005\n\n.woof[WOOF!]\n\n![](https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=500&q=80)\n",
      "notes": "Brief, silly intro. Point out alternate names. Add joke about their energetic reputation. ",
      "properties": {
        "name": null,
        "classes": [],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "# Spoodle Features\n\n- Curls that put ramen noodles to shame\n- Eyes that say \"Take me for a walk\"... all day\n- No concept of personal space\n- Will eat your socks (and blame the cat)\n",
      "notes": "List traits with silly comparisons—highlight curls, neediness, their mischievousness, and a running joke.",
      "properties": {
        "name": null,
        "classes": [],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "# Spoodle in Action\n\n![](https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&w=500&h=350&fit=crop)\n\n- Olympic-level zoomies\n- Nap queen/king (after zoomies only)\n\n.poodley[Professional Lap Warmers]\n",
      "notes": "Highlight their wild playfulness and capacity for speedy running (zoomies) and then how they rest just as hard.",
      "properties": {
        "name": null,
        "classes": [],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "# Pros and Cons\n\n**Pros:**\n- Hypoallergenic floof!\n- Always happy to see you (or your sandwich)\n- Instant internet likes\n\n**Cons:**\n- Will try to outsmart you (and succeed)\n- Spoodle glitter = dog hair on everything\n- FOMO: Fear Of Missing Out (on *everything*)\n",
      "notes": "Be goofy with \"Spoodle glitter\" for shedding, and note their 'always happy' but food-driven nature.",
      "properties": {
        "name": null,
        "classes": [],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "# Famous Spoodle Moves\n\n- The \"I'm So Cute, You Can't Be Mad\" Face\n- The Spoodle Spin (fastest on wet kitchen tiles)\n- Sad Eyes + Head Tilt = World Peace\n- Bark at literally nothing (for fun)\n",
      "notes": "Add a funny take on their classic behaviors, exaggerating the universal doggie antics.",
      "properties": {
        "name": null,
        "classes": [],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "> *\"What's a Spoodle's favorite hobby?\"\n> \n> **Anything you're doing. Or eating. Or carrying.**\n\n.spoodle.center[![](https://images.pexels.com/photos/4587997/pexels-photo-4587997.jpeg?auto=compress&w=500&h=350&fit=crop)]\n\n",
      "notes": "Humorous breed stereotype and a funny picture. Spoodle is the ultimate sidekick.",
      "properties": {
        "name": null,
        "classes": ["spoodle", "center"],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "# Should You Get A Spoodle?\n\n- Do you crave a furry tornado of love?\n- Prepared for a lifetime of *wigglebutts*?\n- Okay with sharing your bed/pillow/soul?\n\nIf you said yes... WELCOME TO THE SPLOOF SIDE 🐾\n",
      "notes": "Silly invite—be ready for an energetic, loving companion. The \"sploot side\" is a play on 'dark side.'",
      "properties": {
        "name": null,
        "classes": [],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    },
    {
      "content": "class: center, middle\n\n# Thank You! \n\n.woof[Go pet a Spoodle. Or at least your closest sock.]\n",
      "notes": "Close with a call to action and a nod to the earlier sock joke.",
      "properties": {
        "name": "end",
        "classes": ["center", "middle"],
        "layout": false,
        "template": null,
        "count": true,
        "exclude": false,
        "backgroundImageUrl": null
      },
      "incrementalFromPrevious": false
    }
  ]
};

export default function DemoSlidesPage() {
  const slideshowRef = useRef<HTMLDivElement>(null);
  const remarkRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically load remarkjs
    const loadRemark = async () => {
      try {
        // Check if remark is already loaded
        if (window.remark) {
          initializeSlideshow();
          return;
        }

        // Load remarkjs script
        const script = document.createElement('script');
        script.src = 'https://remarkjs.com/downloads/remark-latest.min.js';
        script.onload = () => {
          if (window.remark) {
            initializeSlideshow();
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load remarkjs:', error);
      }
    };

    const initializeSlideshow = () => {
      if (!window.remark || !slideshowRef.current) return;

      // Create the markdown content
      const markdownContent = createMarkdownContent(demoDeckData);
      
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
      } catch (error) {
        console.error('Failed to initialize remark:', error);
      }
    };

    loadRemark();

    return () => {
      // Cleanup
      if (remarkRef.current) {
        remarkRef.current = null;
      }
    };
  }, []);

  const createMarkdownContent = (deck: any): string => {
    let markdown = '';
    
    deck.slides.forEach((slide: any, index: number) => {
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

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group>
            <Link href="/slides" passHref>
              <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}>
                Back to Slides
              </Button>
            </Link>
          </Group>
          <Group>
            <IconPresentation size={24} />
            <Title order={1} size="h2">Demo Slides - Spoodle Presentation</Title>
          </Group>
        </Group>

        {/* Instructions */}
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed">
            This is a demo presentation showcasing the remarkjs functionality. Use the arrow keys or click the navigation buttons to navigate through the slides.
            Press 'F' for fullscreen, 'P' for presenter mode, and 'C' to open presenter console.
          </Text>
        </Paper>

        {/* Slideshow Container */}
        <Paper withBorder>
          <div 
            ref={slideshowRef}
            style={{ 
              minHeight: '600px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {/* Remark will render the slides here */}
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Text size="lg" c="dimmed">Loading demo slides...</Text>
            </div>
          </div>
        </Paper>

        {/* Custom CSS Injection */}
        <style dangerouslySetInnerHTML={{ __html: demoDeckData.css }} />
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
