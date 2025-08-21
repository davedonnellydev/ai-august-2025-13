import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { MODEL } from '@/app/config/constants';
import { InputValidator, ServerRateLimiter } from '@/app/lib/utils/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Server-side rate limiting
    if (!ServerRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { input } = await request.json();

    // Enhanced validation
    const textValidation = InputValidator.validateText(input, 2000);
    if (!textValidation.isValid) {
      return NextResponse.json(
        { error: textValidation.error },
        { status: 400 }
      );
    }

    // Environment validation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Translation service temporarily unavailable' },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    // Enhanced content moderation
    const moderatedText = await client.moderations.create({
      input,
    });

    const { flagged, categories } = moderatedText.results[0];

    if (flagged) {
      const keys: string[] = Object.keys(categories);
      const flaggedCategories = keys.filter(
        (key: string) => categories[key as keyof typeof categories]
      );
      return NextResponse.json(
        {
          error: `Content flagged as inappropriate: ${flaggedCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const SlidePropertiesSchema = z.object({
        /** `name:` — identifier for linking/templates */
        name: z.string().min(1).optional().nullable(),
      
        /** `class:` — will be joined as comma-separated list */
        classes: z.array(z.string().min(1)).default([]),
      
        /** `layout:` — when true, slide becomes a layout slide (template for following) */
        layout: z.boolean(),
      
        /** `template:` — name of another slide to prepend/merge from */
        template: z.string().min(1).optional().nullable(),
      
        /** `count:` — exclude this slide from the slide counter when false */
        count: z.boolean(),
      
        /** `exclude:` — hide this slide entirely when true */
        exclude: z.boolean(),
      
        /** `background-image:` — URL for slide background (render as `background-image: url(...)`) */
        backgroundImageUrl: z.string().optional().nullable(),
      }).strict();
      
      /** A single slide */
      const SlideSchema = z.object({
        /** Freeform Markdown content for the slide body (what’s shown on the slide) */
        content: z.string().default(""),
      
        /** Speaker notes, rendered after a `???` separator in Markdown */
        notes: z.string().optional().nullable(),
      
        /** Slide properties that become the initial key: value lines */
        properties: SlidePropertiesSchema.default({
            name: null,
            classes: [],
            layout: false,
            template: null,
            count: true,
            exclude: false,
            backgroundImageUrl: null
        }),
      
        /**
         * When true, render this slide after the previous one using the `--` separator
         * so it inherits previous content (Remark “incremental slide”).
         * If false or omitted, use the standard `---` separator.
         */
        incrementalFromPrevious: z.boolean(),
      }).strict();
           
      /** The whole deck */
      const RemarkDeckSchema = z.object({
     
        /** Global CSS to inject (e.g., inside a <style> tag) */
        css: z.string().default(""),
      
        /** Ordered slides */
        slides: z.array(SlideSchema).min(1),
      }).strict();

    const instructions: string =
    `You are an expert in content creation and delivery. You will be given an idea or set of ideas and your job is to come up with the content for a set of slides based on those ideas. The slides will then be displayed online using remarkjs, so they will need to be delivered in markdown format. Provide all the data to assemble these slides using the provided JSON schema. Ensure you include css for the pack to style the content creatively. 
      
    # Formatting rules
    ## Slide Separators
    A line containing three dashes, represents a slide separator (not a horizontal rule, <hr />, like in regular Markdown). Thus, a simple Markdown text like the one below represents a slideshow with two slides:
      \`\`\`
      # Slide 1
      This is slide 1
      ---
      # Slide 2
      This is slide 2
      \`\`\`
    
    ### Incremental Slides
    To avoid having to duplicate content if a slide is going to add to the previous one, using only two dashes to separate slides will make a slide inherit the content of the previous one:
    \`\`\`
    # Slide
    
    - bullet 1
    --
    
    - bullet 2
    \`\`\`
    The above text expands into the following:
    \`\`\`
    # Slide

    - bullet 1
    ---

    # Slide

    - bullet 1
    - bullet 2
    
    \`\`\`
    Empty lines before and after the two dashes are of significance as the preceding newline character is omitted to enable adding to the last line of the previous slide. Thus, as the extra bullet point in the above example needs to go on a separate line, an extra line is added after the two dashes to force a newline. Without the extra line, the resulting text would have been \`- bullet 1- bullet 2\`.
    
    ## Slide Notes
    A line containing three question marks represents a separator of content and note of the slide:
    \`\`\`
    # Slide

    Some content.

    ???
    Some note.
    \`\`\`
    With Incremental Slides the notes go after each increment:
    \`\`\`
    Hello
    ???
    notes for hello
    --
    World
    ???
    notes for world
    \`\`\`

    ## Comments
    If you want to leave a comment in your markdown, but not render it in the Slide Notes, you can use either of the two following methods. The HTML style comment will be available in the page's source in the browser, while the empty link will not be.
    ### HTML
    \`\`\`
    <!--
    I'm a comment.
    -->
    \`\`\`

    ### Empty Link
    \`\`\`
    [//]: # (I'm a comment)
    \`\`\`
    ## Slide Properties
    Initial lines of a slide on a key-value format will be extracted as slide properties.

    ### name
    The \`name\` property accepts a name used to identify the current slide:

    \`\`\`markdown
    name: agenda

    # Agenda
    \`\`\`

    ### class
    The \`class\` property accepts a comma-separated list of class names, which are applied to the current slide:

    \`\`\`markdown
    class: center, middle

    # Slide with content centered in both dimensions
    \`\`\`

    Resulting HTML extract:

    \`\`\`html
    <div class="remark-slideshow">
    <div class="remark-slide">
        <div class="remark-slide-content center middle">
        <h1>Slide with content centered in both dimensions</h1>
    \`\`\`

    Built-in slide classes include \`left\`, \`center\`, \`right\`, \`top\`, \`middle\` and \`bottom\`, which may be used to [[align entire slides|Formatting#whole-slide-text-alignment]].

    ### background-image
    The \`background-image\` property maps directly to the [background-image](http://www.w3schools.com/cssref/pr_background-image.asp) CSS property, which are applied to the current slide:

    \`\`\`markdown
    background-image: url(image.jpg)

    # Slide with background image
    \`\`\`

    Other slide background CSS properties defined in the default [remark styles](https://github.com/gnab/remark/blob/master/src/remark.less):

    \`\`\`css
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;      /* applied using JavaScript only if background-image is larger than slide */
    \`\`\`

    ### count

    The \`count\` property allows for specific slides not to be included in the slide count, which is by default displayed in the lower right corner of the slideshow:

    \`\`\`markdown
    count: false

    This slide will not be counted.
    \`\`\`

    ### template
    The \`template\` property names another slide to be used as a template for the current slide:

    \`\`\`markdown
    name: other-slide

    Some content.

    ---
    template: other-slide

    Content appended to other-slide's content.
    \`\`\`

    The final content of the current slide will then be this:

    \`\`\`markdown
    Some content.

    Content appended to other-slide's content.
    \`\`\`

    Both template slide content and properties are prepended to the current slide, with the following exceptions:

    - \`name\` and \`layout\` properties are not inherited
    - \`class\` properties are merged, preserving class order

    The \`template\` property may be used to (apparently) add content to a slide incrementally, like bullet lists appearing a bullet at a time.

    Using only two dashes (--) to separate slides implicitly uses the preceding slide as a template:

    \`\`\`markdown
    # Agenda

    --
    1. Introduction

    --
    2. Markdown formatting
    \`\`\`

    Template slides may also contain a special \`{{content}}\` expression to explicitly position the content of derived slides, instead of having it implicitly appended.

    ### layout
    The \`layout\` property either makes the current slide a layout slide, which is omitted from the slideshow and serves as the default template used for all subsequent slides:

    \`\`\`markdown
    layout: true

    # Section

    ---

    ## Sub section 1

    ---

    ## Sub section 2
    \`\`\`

    Or, when set to false, reverts to using no default template.
    Multiple layout slides may be defined throughout the slideshow to define a common template for a series of slides.

    ### exclude
    The \`exclude\` property, when set to \`true\`, hides a slide.  It is a way to filter that slide out so that it is not used at all in rendering.

    ## Content Classes
    Any occurrences of one or more dotted CSS class names followed by square brackets are replaced with the contents of the brackets with the specified classes, as \`\`\`<span>\`\`\` tags, applied:

        .footnote[.red.bold[*] Important footnote]

    Resulting HTML extract:

        <span class="footnote">
        <span class="red bold">*</span> Important footnote
        </span>

    Content classes available include \`left\`, \`center\` and \`right\`, which may be used to align text blocks.

    If you wish to have \`\`\`<div>\`\`\` tags instead, separate your content on new lines a follows:

        .footnote[.red.bold[*]
        Important footnote]

        .footnote[
        .red.bold[
        *]Important footnote]

    Resulting HTML:

        <div class="footnote">
        <span class="red bold">*</span>
        Important footnote
        </div>

        <div class="footnote">
        <div class="red bold">*</div>
        Important footnote
        </div>

    In case of nested brackets, you can use [HTML codes](http://www.ascii.cl/htmlcodes.htm):

        .footnote[.red.bold[*] Opening bracket: &amp;#91;]

    Resulting HTML extract:

        <span class="footnote">
        <span class="red bold">*</span> Opening bracket: [
        </span>

    ## Syntax Highlighting

    Github Flavored Markdown ([GFM](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown)) fenced code blocks are the preferred way of creating code blocks, easily letting you specify the highlighting language:

    <pre>
    Code:

    \`\`\`ruby
    def add(a,b)
    a + b
    end
    \`\`\`</pre>`;

    const response = await client.responses.parse({
      model: MODEL,
      instructions,
      input,
      text: {
        format: zodTextFormat(RemarkDeckSchema, "remark_js_deck")
      }
    });

    if (response.status !== 'completed') {
      throw new Error(`Responses API error: ${response.status}`);
    }

    return NextResponse.json({
      response: response.output_parsed,
      originalInput: input,
      remainingRequests: ServerRateLimiter.getRemaining(ip),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'OpenAI failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
