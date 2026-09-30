import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
import solidConfig from './src/framework/vitest.solid.config.ts';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          environment: 'jsdom',
          isolate: false,
          setupFiles: ['./src/vitest/setup.ts'],
          typecheck: {
            enabled: true,
            checker: fileURLToPath(
              new URL('./node_modules/.bin/tsc', import.meta.url)
            ),
          },
          exclude: [
            ...configDefaults.exclude,
            'src/framework/index.solid.test.ts',
          ],
        },
      },
      solidConfig,
    ],
    coverage: {
      include: ['src'],
      exclude: [
        'src/types',
        'src/vitest',
        'src/framework',
        'src/values.ts',
        '**/index.ts',
        '**/types.ts',
        '**/*.test.ts',
        '**/*.test-d.ts',
      ],
    },
  },
});
