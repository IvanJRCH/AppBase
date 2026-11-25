<script>
  let { texto = "Cargando...", visible = true } = $props();

  $effect(() => {
    setTimeout(() => {
      visible = false;
    }, 700);
  });
</script>

{#if visible}
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 dark:bg-gray-900 text-white gap-3">
    <div class="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    <p class="text-sm font-medium">{texto}</p>
  </div>
{/if}
