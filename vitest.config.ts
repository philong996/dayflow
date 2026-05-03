import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		alias: {
			obsidian: fileURLToPath(new URL('./tests/__mocks__/obsidian.ts', import.meta.url)),
			'@blacksmithgu/datacore': fileURLToPath(new URL('./tests/__mocks__/datacore.ts', import.meta.url)),
		},
	},
});
