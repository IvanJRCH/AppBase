<script>
  import { Alert, Button, Helper, Input, Label, Select, Textarea } from 'flowbite-svelte';

  let formulario = $state({ nombre: '', correo: '', tipo: 'consulta', mensaje: '' });
  let guardado = $state(false);

  function enviar(event) {
    event.preventDefault();
    guardado = true;
  }

  function nuevo() {
    formulario = { nombre: '', correo: '', tipo: 'consulta', mensaje: '' };
    guardado = false;
  }
</script>

<section class="space-y-6">
  <div>
    <h1 class="text-xl font-semibold sm:text-2xl">Pantalla 2</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Formulario de ejemplo: una columna en móvil y dos columnas desde <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">md</code>.
    </p>
  </div>

  {#if guardado}
    <Alert color="green">
      <span class="font-medium">Listo.</span> Se guardaron los datos de "{formulario.nombre || 'sin nombre'}".
      <Button size="xs" color="light" class="ml-2" onclick={nuevo}>Nuevo registro</Button>
    </Alert>
  {/if}

  <form onsubmit={enviar} class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <Label for="nombre">Nombre</Label>
        <Input id="nombre" type="text" placeholder="Tu nombre" bind:value={formulario.nombre} required class="mt-2" />
      </div>

      <div>
        <Label for="correo">Correo electrónico</Label>
        <Input id="correo" type="email" placeholder="nombre@ejemplo.com" bind:value={formulario.correo} required class="mt-2" />
        <Helper class="mt-2 text-xs">No compartiremos tu correo.</Helper>
      </div>

      <div>
        <Label for="tipo">Tipo de solicitud</Label>
        <Select id="tipo" bind:value={formulario.tipo} class="mt-2">
          <option value="consulta">Consulta</option>
          <option value="soporte">Soporte</option>
          <option value="reporte">Reporte</option>
        </Select>
      </div>

      <div>
        <Label for="asunto">Asunto</Label>
        <Input id="asunto" type="text" placeholder="Opcional" class="mt-2" />
      </div>

      <div class="md:col-span-2">
        <Label for="mensaje">Mensaje</Label>
        <Textarea id="mensaje" rows="4" placeholder="Escribe tu mensaje..." bind:value={formulario.mensaje} class="mt-2" required />
      </div>
    </div>

    <div class="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-gray-700">
      <Button type="button" color="light" onclick={nuevo} class="w-full sm:w-auto">Limpiar</Button>
      <Button type="submit" color="orange" class="w-full sm:w-auto">Guardar</Button>
    </div>
  </form>
</section>
