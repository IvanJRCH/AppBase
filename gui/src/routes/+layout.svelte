<script>
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { appName } from '#lib/config';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{appName}</title>
	<meta name="description" content={`${appName} — aplicación de escritorio`} />
</svelte:head>

{@render children()}
