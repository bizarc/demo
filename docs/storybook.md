# Storybook

THE LAB includes a comprehensive Storybook catalog documenting all 23 design system components with interactive controls, auto-generated docs, and interaction tests.

## Getting Started

```bash
# Launch Storybook dev server
npm run storybook

# Opens at http://localhost:6006
```

## Building

```bash
# Build static Storybook for deployment
npm run build-storybook

# Output: storybook-static/
```

## Configuration

Storybook is configured in `.storybook/`:

| File | Purpose |
|------|---------|
| `main.ts` | Framework, addons, story file patterns |
| `preview.ts` | Global decorators, design tokens (imports `globals.css`) |
| `vitest.setup.ts` | Test setup for Storybook interaction tests |

### Addons

| Addon | Purpose |
|-------|---------|
| `@storybook/addon-docs` | Auto-generated documentation from TypeScript interfaces |
| `@storybook/addon-a11y` | Accessibility checks (axe-core) |
| `@storybook/addon-vitest` | Integration tests via play functions |
| `@chromatic-com/storybook` | Visual regression testing (optional) |
| `@storybook/addon-onboarding` | First-time user guide |

## Story Organization

Stories are co-located with components in `src/components/ui/__stories__/`:

```
Design System/
├── Core/
│   ├── Button          # 10 stories (Primary, Secondary, Ghost, Destructive, sizes, loading, disabled, AllVariants, AllSizes)
│   ├── Input           # 7 stories (Default, WithLabel, WithHelperText, WithError, WithLeftIcon, WithRightIcon, Disabled)
│   ├── Card            # 4 stories (Default, Interactive, Selected, AllVariants)
│   ├── Badge           # 6 stories (Live, Draft, Archived, Type, Small, AllVariants)
│   └── Avatar          # 5 stories (UserInitials, Agent, WithStatus, AllSizes, AllVariants)
├── Form Controls/
│   ├── Select          # 6 stories (Default, WithLabel, WithError, Searchable, Disabled, Controlled)
│   ├── Checkbox        # 6 stories (Default, WithDescription, Checked, Indeterminate, Disabled, CheckboxGroup)
│   ├── Radio           # 2 stories (Default, Disabled)
│   ├── Toggle          # 6 stories (Default, WithDescription, Checked, Small, Disabled, Controlled)
│   └── Textarea        # 6 stories (Default, WithLabel, WithHelperText, WithError, NoResize, Disabled)
├── Navigation/
│   ├── Tabs            # 2 stories (Default, WithDisabledTab)
│   ├── Breadcrumbs     # 3 stories (Default, WithIcons, SingleItem)
│   ├── StepIndicator   # 4 stories (FirstStep, MidWay, AllComplete, Horizontal)
│   ├── TopNav          # 3 stories (Default, WithStatus, WithActions)
│   └── Sidebar         # 3 stories (Default, Collapsed, WithHeader)
├── Feedback/
│   ├── Modal           # 3 stories (Default, Small, Large)
│   ├── Toast           # 6 stories (Default, Success, Error, Warning, WithClose, AllVariants)
│   ├── Skeleton        # 6 stories (Text, MultiLine, Circular, Rectangular, CardSkeleton, AvatarSkeletons)
│   ├── Spinner         # 5 stories (Default, Small, Large, AllSizes, OnDarkBackground)
│   └── EmptyState      # 3 stories (Default, NoResults, EmptyInbox)
└── Data Display/
    ├── Divider         # 3 stories (Horizontal, WithLabel, Vertical)
    ├── IconButton      # 5 stories (Default, Ghost, Primary, AllSizes, AllVariants)
    └── ChatBubble      # 5 stories (AgentMessage, UserMessage, WithAvatar, Typing, Conversation)
```

## Interaction Tests

Stories with `play` functions include automated interaction tests that verify component behavior:

- **Button** — Click events, disabled/loading states
- **Input** — Typing, value verification, error states
- **Modal** — Open/close lifecycle
- **Select** — Dropdown interaction, option selection
- **Toggle** — Toggle state changes
- **Checkbox** — Check/uncheck behavior
- **Tabs** — Tab navigation, panel switching

These tests run in the Storybook UI (Interactions panel) and headlessly via:

```bash
npm run test:storybook
```

## Writing New Stories

Follow this pattern for new components:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MyComponent } from '../MyComponent';

const meta = {
    title: 'Design System/Category/MyComponent',
    component: MyComponent,
    tags: ['autodocs'],    // Enables auto-documentation
    argTypes: {
        variant: { control: 'select', options: ['a', 'b'] },
    },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { /* default props */ },
};

export const WithInteraction: Story = {
    args: { /* props */ },
    play: async ({ canvas, userEvent }) => {
        // Interaction test
    },
};
```
