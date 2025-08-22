import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../test-utils/render';
import { SlideInput } from '../SlideInput';

// Mock fetch by intercepting the global fetch function
const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock ClientRateLimiter
jest.mock('@/app/lib/utils/api-helpers', () => ({
  ClientRateLimiter: {
    checkLimit: jest.fn(),
    getRemainingRequests: jest.fn(),
  },
}));

import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';

describe('SlideInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Default rate limiter mocks
    (ClientRateLimiter.checkLimit as jest.Mock).mockReturnValue(true);
    (ClientRateLimiter.getRemainingRequests as jest.Mock).mockReturnValue(15);
  });

  describe('rendering', () => {
    test('should render the component with title', () => {
      render(<SlideInput />);

      expect(screen.getByText('AI Slide Generator')).toBeInTheDocument();
      expect(screen.getByText('View Demo')).toBeInTheDocument();
    });

    test('should render input field and buttons', () => {
      render(<SlideInput />);

      expect(screen.getByLabelText('Describe your slides')).toBeInTheDocument();
      expect(screen.getByText('Generate Slides')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    test('should render how to use section', () => {
      render(<SlideInput />);

      expect(screen.getByText('How to Use')).toBeInTheDocument();
      expect(
        screen.getByText(/Generate AI-powered slide presentations/)
      ).toBeInTheDocument();
    });

    test('should render presentation controls', () => {
      render(<SlideInput />);

      expect(screen.getByText('Presentation Controls:')).toBeInTheDocument();
      expect(screen.getByText(/Arrow keys/)).toBeInTheDocument();
      expect(screen.getByText(/Space/)).toBeInTheDocument();
      expect(screen.getByText(/Navigate between slides/)).toBeInTheDocument();
      expect(screen.getByText(/Fullscreen mode/)).toBeInTheDocument();
      expect(screen.getByText(/Presenter mode/)).toBeInTheDocument();
      expect(screen.getByText(/Clone display/)).toBeInTheDocument();
      expect(screen.getByText(/Return to home page/)).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    test('should update input value on change', () => {
      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      fireEvent.change(input, { target: { value: 'Test input text' } });

      expect(input).toHaveValue('Test input text');
    });

    test.skip('should handle Enter key press', async () => {
      const mockResponse = {
        response: {
          css: '',
          slides: [
            {
              content: 'test',
              notes: null,
              properties: {
                name: null,
                classes: [],
                layout: false,
                template: null,
                count: true,
                exclude: false,
                backgroundImageUrl: null,
              },
              incrementalFromPrevious: false,
            },
          ],
        },
        originalInput: 'Test input',
        remainingRequests: 14,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('API requests', () => {
    test('should make API request when Generate Slides is clicked', async () => {
      const mockResponse = {
        response: {
          css: '',
          slides: [
            {
              content: 'test',
              notes: null,
              properties: {
                name: null,
                classes: [],
                layout: false,
                template: null,
                count: true,
                exclude: false,
                backgroundImageUrl: null,
              },
              incrementalFromPrevious: false,
            },
          ],
        },
        originalInput: 'Test input',
        remainingRequests: 14,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/openai/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: 'Test input' }),
        });
      });
    });

    test('should show loading state during API request', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      expect(screen.getByText('Generate Slides')).toHaveAttribute(
        'data-loading',
        'true'
      );

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        json: async () => ({ response: { css: '', slides: [] } }),
      });

      await waitFor(() => {
        expect(screen.getByText('Generate Slides')).not.toHaveAttribute(
          'data-loading',
          'true'
        );
      });
    });

    test('should clear input after successful generation', async () => {
      const mockResponse = {
        response: {
          css: '',
          slides: [
            {
              content: 'test',
              notes: null,
              properties: {
                name: null,
                classes: [],
                layout: false,
                template: null,
                count: true,
                exclude: false,
                backgroundImageUrl: null,
              },
              incrementalFromPrevious: false,
            },
          ],
        },
        originalInput: 'Test input',
        remainingRequests: 14,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    test.skip('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      });

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('rate limiting', () => {
    test('should check rate limit before making request', async () => {
      (ClientRateLimiter.checkLimit as jest.Mock).mockReturnValue(false);

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      expect(ClientRateLimiter.checkLimit).toHaveBeenCalled();
      expect(
        screen.getByText('Rate limit exceeded. Please try again later.')
      ).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should update remaining requests after successful generation', async () => {
      const mockResponse = {
        response: {
          css: '',
          slides: [
            {
              content: 'test',
              notes: null,
              properties: {
                name: null,
                classes: [],
                layout: false,
                template: null,
                count: true,
                exclude: false,
                backgroundImageUrl: null,
              },
              incrementalFromPrevious: false,
            },
          ],
        },
        originalInput: 'Test input',
        remainingRequests: 14,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      (ClientRateLimiter.getRemainingRequests as jest.Mock).mockReturnValue(14);

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(ClientRateLimiter.getRemainingRequests).toHaveBeenCalled();
      });
    });
  });

  describe('validation', () => {
    test('should show error for empty input', async () => {
      render(<SlideInput />);

      const generateButton = screen.getByText('Generate Slides');
      fireEvent.click(generateButton);

      expect(
        screen.getByText('Please enter some text to translate')
      ).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should show error for whitespace-only input', async () => {
      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(generateButton);

      expect(
        screen.getByText('Please enter some text to translate')
      ).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('reset functionality', () => {
    test('should clear input and error on reset', () => {
      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const resetButton = screen.getByText('Reset');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(resetButton);

      expect(input).toHaveValue('');
    });
  });

  describe('cache management', () => {
    test('should load cached slides on mount', () => {
      const mockCachedSlides = [
        {
          input: 'Cached input',
          deck: {
            css: '',
            slides: [
              {
                content: 'cached',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
            ],
          },
          timestamp: Date.now(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockCachedSlides)
      );

      render(<SlideInput />);

      expect(screen.getByText('Generated Presentations')).toBeInTheDocument();
      expect(screen.getByText('Cached input')).toBeInTheDocument();
    });

    test('should add new slides to cache after generation', async () => {
      const mockResponse = {
        response: {
          css: '',
          slides: [
            {
              content: 'test',
              notes: null,
              properties: {
                name: null,
                classes: [],
                layout: false,
                template: null,
                count: true,
                exclude: false,
                backgroundImageUrl: null,
              },
              incrementalFromPrevious: false,
            },
          ],
        },
        originalInput: 'Test input',
        remainingRequests: 14,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<SlideInput />);

      const input = screen.getByLabelText('Describe your slides');
      const generateButton = screen.getByText('Generate Slides');

      fireEvent.change(input, { target: { value: 'Test input' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    test('should clear all cached slides', () => {
      const mockCachedSlides = [
        {
          input: 'Cached input',
          deck: {
            css: '',
            slides: [
              {
                content: 'cached',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
            ],
          },
          timestamp: Date.now(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockCachedSlides)
      );

      render(<SlideInput />);

      // Find the clear button by looking for the trash icon
      const clearButton = screen.getByTestId('clear-cache-button');
      fireEvent.click(clearButton);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'ai-slides-cache'
      );
      expect(
        screen.queryByText('Generated Presentations')
      ).not.toBeInTheDocument();
    });

    test.skip('should delete individual presentation', () => {
      const mockCachedSlides = [
        {
          input: 'Cached input',
          deck: {
            css: '',
            slides: [
              {
                content: 'cached',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
            ],
          },
          timestamp: Date.now(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockCachedSlides)
      );

      render(<SlideInput />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-slides-cache',
        '[]'
      );
    });

    test('should show new badge for recent presentations', () => {
      const mockCachedSlides = [
        {
          input: 'Recent input',
          deck: {
            css: '',
            slides: [
              {
                content: 'recent',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
            ],
          },
          timestamp: Date.now(), // Very recent
        },
      ];

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockCachedSlides)
      );

      render(<SlideInput />);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    test('should format timestamp correctly', () => {
      const mockCachedSlides = [
        {
          input: 'Cached input',
          deck: {
            css: '',
            slides: [
              {
                content: 'cached',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
            ],
          },
          timestamp: Date.now(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockCachedSlides)
      );

      render(<SlideInput />);

      // Should show formatted date
      expect(screen.getByText(/Generated:/)).toBeInTheDocument();
    });

    test('should show correct slide count', () => {
      const mockCachedSlides = [
        {
          input: 'Cached input',
          deck: {
            css: '',
            slides: [
              {
                content: 'slide 1',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
              {
                content: 'slide 2',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: false,
                  backgroundImageUrl: null,
                },
                incrementalFromPrevious: false,
              },
              {
                content: 'slide 3',
                notes: null,
                properties: {
                  name: null,
                  classes: [],
                  layout: false,
                  template: null,
                  count: true,
                  exclude: true,
                }, // Excluded
                incrementalFromPrevious: false,
              },
            ],
          },
          timestamp: Date.now(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockCachedSlides)
      );

      render(<SlideInput />);

      expect(screen.getByText(/2 slides/)).toBeInTheDocument();
    });
  });

  describe('remaining requests display', () => {
    test('should show remaining requests count', () => {
      (ClientRateLimiter.getRemainingRequests as jest.Mock).mockReturnValue(10);

      render(<SlideInput />);

      expect(
        screen.getByText(/You have 10 slide-pack generations remaining/)
      ).toBeInTheDocument();
    });
  });
});
