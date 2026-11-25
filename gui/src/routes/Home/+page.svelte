<script>
  import { fade } from 'svelte/transition';
  import SpinnerCarga from '#lib/SpinnerCarga.svelte';
  import TemaToggle from '#lib/TemaToggle.svelte';
  import { appName, appVersion } from '#lib/config';
  import {
    modulos,
    modulosVisibles,
    grupos,
    modulosDelGrupo,
    alternarModulo,
    esModuloVisible,
    mostrarTodos,
    ocultarTodos,
  } from '#lib/modulos.svelte.js';

  let menuAbierto = $state(false);
  let innerWidth = $state(0);
  let menuActivo = $state('');

  const esDesktop = $derived(innerWidth >= 1024);
  const visibles = $derived(modulosVisibles());
  const gruposVisibles = $derived(grupos());
  const moduloActivo = $derived(visibles.find((m) => m.name === menuActivo) ?? null);

  function seleccionarMenu(id) {
    menuActivo = id;
    menuAbierto = false;
  }

  function cerrarConEscape(event) {
    if (event.key === 'Escape') menuAbierto = false;
  }

  // Evita que la página se desplace detrás del menú en pantallas pequeñas.
  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = menuAbierto && !esDesktop ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window bind:innerWidth onkeydown={cerrarConEscape} />

<SpinnerCarga texto="Cargando..." />

<div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
  <!-- Header: SIEMPRE visible, altura fija (h-16 = 4rem) -->
  <header class="fixed inset-x-0 top-0 z-40 h-16 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
    <div class="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-6">
      <button
        type="button"
        onclick={() => (menuAbierto = !menuAbierto)}
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuAbierto}
        aria-controls="menu-lateral"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 lg:hidden dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {#if menuAbierto}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        {/if}
      </button>

      <div class="flex min-w-0 items-center gap-2">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">A</span>
        <span class="truncate text-lg font-semibold sm:text-xl">{appName}</span>
      </div>

      <span class="ml-auto hidden truncate text-sm text-gray-500 sm:block dark:text-gray-400">
        {moduloActivo?.label ?? 'Panel'}
      </span>
      <div class="ml-auto shrink-0 sm:ml-3"><TemaToggle /></div>
    </div>
  </header>

  <!-- Fondo oscuro: solo móvil/tablet mientras el menú está abierto -->
  {#if menuAbierto}
    <button
      type="button"
      class="fixed inset-0 top-16 z-30 cursor-default bg-gray-900/50 lg:hidden"
      onclick={() => (menuAbierto = false)}
      aria-label="Cerrar menú"
      transition:fade={{ duration: 150 }}
    ></button>
  {/if}

  <!-- Sidebar: cajón deslizante bajo 'lg'; fijo y siempre visible desde 'lg' -->
  <aside
    id="menu-lateral"
    inert={!menuAbierto && !esDesktop}
    class="fixed bottom-0 left-0 top-16 z-40 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:w-64 lg:translate-x-0 lg:shadow-none dark:border-gray-700 dark:bg-gray-800 {menuAbierto ? 'translate-x-0' : '-translate-x-full'}"
  >
    <nav class="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
      {#each gruposVisibles as grupo}
        {@const items = modulosDelGrupo(grupo)}
        {#if items.length > 0}
          <h2 class="mb-2 mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{grupo}</h2>
          <ul class="space-y-1">
            {#each items as m}
              <li>
                <button
                  type="button"
                  onclick={() => seleccionarMenu(m.name)}
                  aria-current={menuActivo === m.name ? 'page' : undefined}
                  class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 {menuActivo === m.name ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d={m.icono} />
                  </svg>
                  <span class="truncate">{m.label}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    </nav>

    <div class="shrink-0 border-t border-gray-200 px-5 py-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {appName} v{appVersion}
    </div>
  </aside>

  <!-- Contenido: padding lateral en vez de margin para no generar scroll horizontal -->
  <main class="min-h-screen pt-16 lg:pl-64">
    <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {#if !moduloActivo}
        <section class="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center sm:p-12 dark:border-gray-600 dark:bg-gray-800">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </div>
          <h1 class="text-xl font-semibold sm:text-2xl">{appName}</h1>
          <p class="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Selecciona una opción del menú para comenzar. En pantallas pequeñas, abre el menú con el botón de la esquina superior izquierda.
          </p>

          <!-- Demo de visibilidad: se puede borrar; las funciones están en #lib/modulos.svelte.js -->
          <div class="mx-auto mt-8 max-w-2xl rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-700 dark:bg-gray-900/50">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Demo: mostrar / ocultar módulos del menú</p>
            <div class="mt-3 flex flex-wrap gap-2">
              {#each modulos as m}
                <button
                  type="button"
                  onclick={() => alternarModulo(m.name)}
                  class="rounded-full border px-3 py-1.5 text-xs font-medium transition {esModuloVisible(m.name) ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' : 'border-gray-300 text-gray-500 line-through dark:border-gray-600 dark:text-gray-400'}"
                >
                  {m.label}
                </button>
              {/each}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" onclick={mostrarTodos} class="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Mostrar todos</button>
              <button type="button" onclick={ocultarTodos} class="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Ocultar todos</button>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Por defecto todos están ocultos. Toca uno para mostrarlo u ocultarlo. Las mismas funciones se pueden llamar desde cualquier componente.
            </p>
          </div>
        </section>
      {:else}
        {@const Componente = moduloActivo.Componente}
        <Componente />
      {/if}
    </div>
  </main>
</div>
