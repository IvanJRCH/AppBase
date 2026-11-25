<script>
  import { onMount } from 'svelte';
  import { Alert, Badge, Button } from 'flowbite-svelte';
  import { peticion } from '#lib/api';
  import {
    modulos,
    modulosVisibles,
    grupos,
    modulosDelGrupo,
    alternarModulo,
    esModuloVisible,
    mostrarTodos,
    ocultarTodos,
    ocultarModulo,
    mostrarModulo
  } from '#lib/modulos.svelte.js';

  let saludo = $state('');
  let contador = $state(null);
  let cargando = $state(true);
  let error = $state('');

  async function cargar() {
    cargando = true;
    error = '';
    try {
      const [respuestaSaludo, respuestaContador] = await Promise.all([
        peticion('/api/ejemplo/saludo'),
        peticion('/api/ejemplo/contador'),
      ]);
      if (!respuestaSaludo.ok || !respuestaContador.ok) {
        throw new Error('Error al consultar la API del módulo');
      }
      saludo = (await respuestaSaludo.json()).mensaje;
      contador = (await respuestaContador.json()).valor;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      cargando = false;
    }
  }

  onMount(cargar);
</script>

<section class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 class="text-xl font-semibold sm:text-2xl">Módulo ejemplo</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Su lógica vive en <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">modules/ejemplo/index.js</code>
        y su interfaz en <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">modules/ejemplo/gui/</code>.
      </p>
    </div>
    {#if saludo && !error}
      <Badge color="green" class="w-fit">Módulo conectado</Badge>
    {/if}
  </div>

  {#if error}
    <Alert color="red">
      <span class="font-medium">No se pudo cargar:</span> {error}
      <Button size="xs" color="red" class="ml-2" onclick={cargar}>Reintentar</Button>
    </Alert>
  {/if}

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Saludo del módulo</p>
      <p class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
        {cargando ? 'Cargando...' : (saludo || '—')}
      </p>
    </div>
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Contador</p>
      <p class="mt-2 text-3xl font-semibold text-orange-600 dark:text-orange-400">
        {cargando ? '...' : (contador ?? '—')}
      </p>
    </div>
  </div>

  <div class="mt-3 flex flex-wrap gap-2">
    <button type="button" onclick={()=>{
      mostrarModulo("pantalla1");
    }} class="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Mostrar todos</button>
    <button type="button" onclick={()=>{
      ocultarModulo("pantalla1");
    }} class="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Ocultar todos</button>
  </div>

  <Button color="light" onclick={cargar} class="w-full sm:w-auto">Actualizar</Button>
</section>
