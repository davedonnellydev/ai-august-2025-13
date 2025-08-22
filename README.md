# Project 13 #AIAugustAppADay: Markdown to Slides Converter

![Last Commit](https://img.shields.io/github/last-commit/davedonnellydev/ai-august-2025-13)

**📆 Date**: 21/Aug/2025  
**🎯 Project Objective**: Upload/paste markdown, convert it to simple web slides.  
**🚀 Features**: Markdown input; Parse to slides (sections as slides); Keyboard navigation; Stretch goals: Download as PDF  
**🛠️ Tech used**: Next.js, TypeScript, OpenAI API, [remarkjs](https://github.com/gnab/remark)  
**▶️ Live Demo**: [https://ai-august-2025-13.netlify.app](https://ai-august-2025-13.netlify.app)

## 🗒️ Summary

This project started as a simple **Markdown-to-HTML slide converter**, but it evolved into something more fun: an **AI-powered slide pack generator**.

Using `remark.js` to power the slide conversion, I built an app that lets the user input a description of a slide pack and have AI generate the HTML markup and styling for a presentation. The app also stores the generated packs in `localStorage`, so users can revisit them later, create new ones, or delete ones they no longer need.

The day was a little interrupted by real life (our washing machine broke down 🚰😅), so I didn’t get to implement editing functionality for the slide packs — a feature I would have loved to include. Still, I think the end result is a fun twist on remark.js and shows how AI can be used not just for analysis, but also for **generating structured, creative content**.

**Lessons learned**

- As possibilities reveal themselves, projects can shift from their original concept into something more interesting — let them evolve.
- Even simple frameworks like `remark.js` become powerful when paired with AI generation.
- Local storage is a great lightweight way to persist user data without overcomplicating with a backend.

**Final thoughts**  
While it’s not feature-complete, this was a fun project to work on, and I’d love to expand it in the future with editing capabilities. For now, it’s a neat little experiment in turning descriptions into full AI-powered slide decks.

This project has been built as part of my AI August App-A-Day Challenge. You can read more information on the full project here: [https://github.com/davedonnellydev/ai-august-2025-challenge](https://github.com/davedonnellydev/ai-august-2025-challenge).

## 🧪 Testing

![CI](https://github.com/davedonnellydev/ai-august-2025-13/actions/workflows/npm_test.yml/badge.svg)  
_Note: Test suite runs automatically with each push/merge._

## Quick Start

1. **Clone and install:**

   ```bash
   git clone https://github.com/davedonnellydev/ai-august-2025-13.git
   cd ai-august-2025-13
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development:**

   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# OpenAI API (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

```

### Key Configuration Files

- `next.config.mjs` – Next.js config with bundle analyzer
- `tsconfig.json` – TypeScript config with path aliases (`@/*`)
- `theme.ts` – Mantine theme customization
- `eslint.config.mjs` – ESLint rules (Mantine + TS)
- `jest.config.cjs` – Jest testing config
- `.nvmrc` – Node.js version

### Path Aliases

```ts
import { Component } from '@/components/Component'; // instead of '../../../components/Component'
```

## 📦 Available Scripts

### Build and dev scripts

- `npm run dev` – start dev server
- `npm run build` – bundle application for production
- `npm run analyze` – analyze production bundle

### Testing scripts

- `npm run typecheck` – checks TypeScript types
- `npm run lint` – runs ESLint
- `npm run jest` – runs jest tests
- `npm run jest:watch` – starts jest watch
- `npm test` – runs `prettier:check`, `lint`, `typecheck` and `jest`

### Other scripts

- `npm run prettier:check` – checks files with Prettier
- `npm run prettier:write` – formats files with Prettier

## 📜 License

![GitHub License](https://img.shields.io/github/license/davedonnellydev/ai-august-2025-13)  
This project is licensed under the MIT License.
