# Slides Functionality

This application now includes a comprehensive slides system that integrates with remarkjs to create beautiful HTML presentations from AI-generated content, with intelligent local storage caching to avoid unnecessary API calls.

## Features

### 1. AI-Powered Slide Generation
- Users can input a topic or description
- The AI generates structured slide content following the RemarkDeckSchema
- Includes custom CSS styling for each presentation
- Supports speaker notes, slide properties, and incremental slides

### 2. Local Storage Caching
- **Automatic caching** of all AI-generated presentations
- **Cache management** with configurable size limits (default: 10 presentations)
- **Instant retrieval** of previously generated slides without API calls
- **Cache persistence** across browser sessions
- **Smart cache updates** that replace duplicate inputs with fresh content

### 3. RemarkJS Integration
- Uses remarkjs to transform markdown into HTML slides
- Supports all remarkjs features including:
  - Slide separators (`---` and `--`)
  - Slide notes (`???`)
  - Slide properties (name, class, layout, template, count, exclude, background-image)
  - Content classes with custom styling
  - Syntax highlighting for code blocks

### 4. Interactive Slide Navigation
- Full keyboard navigation (arrow keys)
- Navigation buttons (First, Previous, Play/Pause, Next, Last)
- Auto-play functionality with 5-second intervals
- Slide counter and progress indicator

### 5. Multiple Access Points
- **Home Page** (`/`): Generate new slides with AI and view cached presentations
- **Slides Page** (`/slides`): View and navigate cached slides with cache management
- **Demo Slides** (`/slides/demo`): View example presentation

## How It Works

### 1. Slide Generation & Caching
1. User enters a topic description on the home page
2. The app calls the OpenAI API endpoint (`/api/openai/responses`)
3. AI returns structured data in RemarkDeckSchema format
4. **The response is automatically cached in localStorage**
5. Future requests for the same topic use cached data instantly

### 2. Cache Management
- **Storage Key**: `ai-slides-cache`
- **Max Cache Size**: 10 presentations (configurable)
- **Cache Structure**: Array of objects with input, deck, and timestamp
- **Smart Updates**: Replaces existing entries with same input
- **Persistent Storage**: Survives browser restarts and page refreshes

### 3. Slide Rendering
1. The slides page loads cached presentations from localStorage
2. User selects a cached presentation from the dropdown
3. Converts the data to remarkjs markdown format
4. Dynamically loads remarkjs library
5. Initializes the slideshow with custom configuration
6. Applies custom CSS styling
7. Renders interactive HTML slides

### 4. Slide Properties
Each slide can have the following properties:
- **name**: Identifier for linking and templates
- **classes**: CSS classes for styling and alignment
- **layout**: Whether the slide serves as a template
- **template**: Reference to another slide for inheritance
- **count**: Whether to include in slide counter
- **exclude**: Whether to hide the slide entirely
- **backgroundImageUrl**: Background image for the slide

## File Structure

```
app/
├── slides/
│   ├── page.tsx          # Main slides page with cache management
│   └── demo/
│       └── page.tsx      # Demo slides page
├── hooks/
│   └── useSlides.ts      # Custom hook with caching functionality
└── api/openai/responses/
    └── route.ts          # AI endpoint with schema
```

## Usage Examples

### Basic Slide Generation
1. Go to the home page
2. Enter a topic like "Benefits of renewable energy"
3. Click "Generate Slides"
4. View the generated JSON response
5. **The slides are automatically cached**
6. Click "View Presentation" to see the slides

### Viewing Cached Slides
1. Navigate to `/slides`
2. **Select a cached presentation from the dropdown**
3. Use navigation controls to move between slides
4. Press 'F' for fullscreen, 'P' for presenter mode

### Cache Management
- **View Cache**: See recently generated presentations on the home page
- **Clear Cache**: Use the trash icon to remove all cached presentations
- **Cache Limits**: Automatically manages storage with configurable limits
- **Persistent Storage**: Cache survives browser restarts

### Demo Slides
1. Visit `/slides/demo` to see example slides
2. Demonstrates the "Spoodle" presentation
3. Shows various remarkjs features in action

## Technical Details

### Cache Implementation
```typescript
interface CachedSlide {
  input: string;        // The original user input
  deck: RemarkDeck;     // The generated slide deck
  timestamp: number;     // When it was generated
}

const STORAGE_KEY = 'ai-slides-cache';
const MAX_CACHE_SIZE = 10;
```

### Cache Operations
- **Add to Cache**: Automatically stores new AI responses
- **Get from Cache**: Retrieves cached presentations by input
- **Update Cache**: Replaces existing entries with fresh content
- **Clear Cache**: Removes all cached presentations
- **Size Management**: Automatically limits cache to prevent storage bloat

### RemarkJS Configuration
```javascript
remark.create({
  sourceUrl: '#source',
  highlightStyle: 'github',
  highlightLines: true,
  highlightSpans: true,
  countIncrementalSlides: false,
});
```

### Markdown Generation
The app converts the schema data to remarkjs markdown format:
- Slide properties become key-value pairs at the top of each slide
- Content is inserted as-is
- Notes are added after `???` separators
- Slide separators use `---` or `--` based on incremental settings

### CSS Injection
Custom CSS is injected into the page using React's `dangerouslySetInnerHTML`:
- Applied globally to all slides
- Can override default remarkjs styles
- Supports custom classes and animations

## Performance Benefits

### 1. Reduced API Calls
- **Instant retrieval** of previously generated content
- **No rate limit consumption** for cached presentations
- **Faster user experience** with immediate slide loading

### 2. Offline Capability
- **Cached presentations work offline** (after initial generation)
- **Persistent storage** across browser sessions
- **Reduced server dependency** for viewing slides

### 3. Cost Optimization
- **Lower OpenAI API costs** through intelligent caching
- **Reduced bandwidth usage** for repeated content
- **Better rate limit management** for new content generation

## Keyboard Shortcuts

- **Arrow Keys**: Navigate between slides
- **F**: Toggle fullscreen
- **P**: Enter presenter mode
- **C**: Open presenter console
- **Space**: Next slide
- **Shift + Space**: Previous slide

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires JavaScript enabled
- **Requires localStorage support** for caching functionality
- Responsive design for mobile and desktop
- Works with touch gestures on mobile devices

## Future Enhancements

- **Export to PDF** functionality
- **Slide templates and themes**
- **Collaborative editing**
- **Slide sharing and embedding**
- **Custom animations and transitions**
- **Integration with presentation software**
- **Advanced cache analytics** (usage patterns, storage optimization)
- **Cloud sync** for cross-device access
- **Cache compression** for larger presentations
