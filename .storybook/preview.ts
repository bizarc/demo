import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'canvas',
      values: [
        { name: 'canvas', value: '#F8F9FA' },
        { name: 'surface', value: '#FFFFFF' },
        { name: 'dark', value: '#111827' },
      ],
    },
    a11y: {
      test: 'todo'
    }
  },
};

export default preview;