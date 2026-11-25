<script>
  import { onMount } from 'svelte';
  import { Alert, Badge, Button } from 'flowbite-svelte';
  import { peticion } from '#lib/api';

  let datos = $state(null);
  let cargando = $state(true);
  let error = $state('');

  async function cargar() {
    cargando = true;
    error = '';
    try {
      const respuesta = await peticion('/api/datos');
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
      datos = await respuesta.json();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      cargando = false;
    }
  }

  onMount(cargar);

  const items = $derived(datos?.items ?? []);
  const total = $derived(items.reduce((suma, item) => suma + Number(item.valor || 0), 0));
  const promedio = $derived(items.length ? Math.round(total / items.length) : 0);
</script>

<section class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 class="text-xl font-semibold sm:text-2xl">Pantalla 1</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Datos de ejemplo consumidos desde <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">/api/datos</code>.
      </p>
    </div>
    {#if datos && !error}
      <Badge color="green" class="w-fit">API conectada</Badge>
    {/if}
  </div>

  {#if error}
    <Alert color="red">
      <span class="font-medium">No se pudieron cargar los datos:</span> {error}
      <Button size="xs" color="red" class="ml-2" onclick={cargar}>Reintentar</Button>
    </Alert>
  {/if}

  {#if cargando}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando datos">
      {#each [1, 2, 3] as _}
        <div class="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div class="mt-4 h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      {/each}
    </div>
  {:else if datos}
    <!-- Resumen: 1 columna en móvil, 2 en tablet, 3 en escritorio -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Elementos</p>
        <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{items.length}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Valor total</p>
        <p class="mt-2 text-3xl font-semibold text-orange-600 dark:text-orange-400">{total.toLocaleString('es')}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Promedio</p>
        <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{promedio.toLocaleString('es')}</p>
      </div>
    </div>

    <!-- Tabla en pantallas medianas+, tarjetas en móvil -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <h2 class="text-sm font-semibold">{datos.titulo ?? 'Datos'}</h2>
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full min-w-[32rem] text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-5 py-3">ID</th>
              <th scope="col" class="px-5 py-3">Nombre</th>
              <th scope="col" class="px-5 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each items as item (item.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400">{item.id}</td>
                <td class="px-5 py-3 font-medium">{item.nombre}</td>
                <td class="px-5 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">{Number(item.valor).toLocaleString('es')}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <ul class="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
        {#each items as item (item.id)}
          <li class="flex items-center justify-between gap-4 px-4 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{item.nombre}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">ID {item.id}</p>
            </div>
            <span class="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
              {Number(item.valor).toLocaleString('es')}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>
