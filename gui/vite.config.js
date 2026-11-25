import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const configuracion = JSON.parse(
	readFileSync(new URL('../config.json', import.meta.url), 'utf-8')
);
const hostBackend =
	configuracion.server?.host === '0.0.0.0'
		? '127.0.0.1'
		: configuracion.server?.host || '127.0.0.1';
const puertoBackend = Number(configuracion.server?.port) || 7070;
const destinoBackend = `http://${hostBackend}:${puertoBackend}`;

const proxy = {
	'/api': { target: destinoBackend, changeOrigin: true },
};

// Los componentes de modules/ viven fuera de gui/, así que los paquetes
// (flowbite-svelte, etc.) se resuelven desde gui/node_modules.
const resolverModulos = {
	name: 'resolver-modulos',
	resolveId(source, importer) {
		if (
			importer &&
			/[\\/]modules[\\/]/.test(importer) &&
			!source.startsWith('.') &&
			!source.startsWith('/')
		) {
			return this.resolve(
				source,
				fileURLToPath(new URL('./src/lib/index.js', import.meta.url)),
				{ skipSelf: true }
			);
		}
		return null;
	},
};

export default defineConfig({
	server: {
		fs: { allow: ['..'] },
		proxy
	},
	plugins: [
		resolverModulos,
		tailwindcss(),
		sveltekit({
			output: {
				bundleStrategy: 'inline'
			},
			router: {
				type: 'hash'
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true,
			})
		})
	]
});
