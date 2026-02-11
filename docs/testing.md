# Testing

THE LAB uses **Vitest** as the unified test runner across all testing layers, with **React Testing Library** for component tests and **Storybook** for visual + interaction testing.

## Test Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vitest                                  │
│                                                             │
│  ┌──────────────────┐     ┌──────────────────────────────┐  │
│  │   Unit Project    │     │     Storybook Project        │  │
│  │   (jsdom)         │     │     (Playwright browser)     │  │
│  │                   │     │                              │  │
│  │  • Utility tests  │     │  • Component rendering       │  │
│  │  • Component tests│     │  • Interaction tests (play)  │  │
│  │  • API logic      │     │  • Visual regression         │  │
│  │                   │     │  • Accessibility (a11y)       │  │
│  └──────────────────┘     └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm run test` | Run unit tests only |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:storybook` | Run Storybook interaction tests (headless browser) |
| `npm run test:all` | Run all test projects |

## Configuration

Tests are configured in `vitest.config.ts` with two projects:

- **unit** — jsdom environment, `src/**/*.test.{ts,tsx}`, uses `@testing-library/react`
- **storybook** — Playwright browser, runs `play` functions from `.stories.tsx` files

## Test Organization

```
src/
├── lib/
│   └── __tests__/
│       ├── prompts.test.ts        # 12 tests
│       └── creatorId.test.ts      #  5 tests
├── components/
│   └── ui/
│       ├── __tests__/
│       │   ├── Button.test.tsx    # 10 tests
│       │   ├── Input.test.tsx     #  9 tests
│       │   └── Badge.test.tsx     #  7 tests
│       └── __stories__/
│           ├── Button.stories.tsx  # 10 stories + interaction tests
│           ├── Input.stories.tsx   #  7 stories + interaction tests
│           ├── Modal.stories.tsx   #  3 stories + interaction tests
│           └── ...                 # 20 more story files
└── test/
    └── setup.ts                   # @testing-library/jest-dom/vitest
```

## Writing Unit Tests

Unit tests use Vitest + React Testing Library:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
    it('fires onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Click me</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).toHaveBeenCalledOnce();
    });
});
```

## Writing Storybook Interaction Tests

Interaction tests use `play` functions within stories:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { Button } from '../Button';

export const Primary: Story = {
    args: { children: 'Click me', onClick: fn() },
    play: async ({ canvas, userEvent, args }) => {
        const button = canvas.getByRole('button');
        await userEvent.click(button);
        await expect(args.onClick).toHaveBeenCalledOnce();
    },
};
```

## Components with Interaction Tests

| Component | Scenarios Tested |
|-----------|-----------------|
| Button | Click fires handler, disabled/loading prevent clicks |
| Input | Type text verifies value, error shows aria-invalid |
| Modal | Open via button, verify dialog visible, close via Cancel |
| Select | Open dropdown, select option, verify update |
| Toggle | Toggle on/off, verify description changes |
| Checkbox | Check/uncheck, verify state |
| Tabs | Navigate between tabs, verify panel switching |

## Coverage

Current test counts:

| Layer | Tests |
|-------|-------|
| Utility unit tests | 17 |
| Component unit tests | 26 |
| Storybook stories | 65+ |
| Interaction tests | 7 components |

## Future Testing

- **Integration tests** for API routes (`/api/demo`, `/api/chat`, `/api/scrape`)
- **E2E tests** with Playwright for full user flows
- **Visual regression** with Chromatic (optional)
