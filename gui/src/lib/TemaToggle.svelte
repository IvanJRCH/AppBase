<script>
  import { Button } from 'flowbite-svelte';

  let oscuro = $state(false);

  function alternar() {
    oscuro = !oscuro;
    if (typeof document !== 'undefined') {
      if (oscuro) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('app-tema', 'oscuro');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('app-tema', 'claro');
      }
    }
  }

  // Leer tema guardado / preferencia del sistema al cargar
  if (typeof window !== 'undefined') {
    const guardado = localStorage.getItem('app-tema');
    if (guardado === 'oscuro' || (!guardado && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      oscuro = true;
      document.documentElement.classList.add('dark');
    }
  }
</script>

<Button
  onclick={alternar}
  class="p-2 rounded-lg bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition"
  title="Cambiar tema"
>
  {#if oscuro}
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  {:else}
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  {/if}
</Button>
