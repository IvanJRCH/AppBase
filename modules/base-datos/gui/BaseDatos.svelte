<script>
  import { onMount } from 'svelte';
  import { Alert, Button, Input } from 'flowbite-svelte';
  import { peticion } from '#lib/api';

  let notas = $state([]);
  let texto = $state('');
  let error = $state('');
  let guardando = $state(false);

  async function cargar() {
    error = '';
    try {
      const respuesta = await peticion('/api/base-datos/notas');
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? 'Error al cargar');
      notas = datos.notas;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  async function guardar(event) {
    event.preventDefault();
    if (!texto.trim()) return;
    guardando = true;
    error = '';
    try {
      const respuesta = await peticion('/api/base-datos/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? 'Error al guardar');
      texto = '';
      await cargar();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      guardando = false;
    }
  }

  onMount(cargar);
</script>

<section class="space-y-6">
  <div>
    <h1 class="text-xl font-semibold sm:text-2xl">Base de datos (Sequelize + SQLite)</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Datos guardados con SQLite. El addon nativo se detecta y se incrusta automáticamente en el ejecutable.
    </p>
  </div>

  {#if error}
    <Alert color="red"><span class="font-medium">Error:</span> {error}</Alert>
  {/if}

  <form onsubmit={guardar} class="flex flex-col gap-3 sm:flex-row">
    <Input type="text" placeholder="Escribe una nota" bind:value={texto} class="flex-1" />
    <Button type="submit" color="orange" disabled={guardando} class="w-full sm:w-auto">
      {guardando ? 'Guardando...' : 'Guardar'}
    </Button>
  </form>

  <ul class="space-y-2">
    {#each notas as nota (nota.id)}
      <li class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <span class="font-medium">{nota.texto}</span>
        <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">#{nota.id}</span>
      </li>
    {:else}
      <li class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
        No hay notas todavía.
      </li>
    {/each}
  </ul>
</section>
