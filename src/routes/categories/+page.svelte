<script lang="ts">
  import { api, type Category } from '$lib/rpc/client';
  import { showToast } from '$lib/stores/toasts';
  import { Pencil, Plus, Trash2, X } from '@lucide/svelte';

  const palette = ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#475569', '#991B1B'];

  let categories: Category[] = [];
  let error = '';
  let editingId: number | null = null;
  let customColorInput: HTMLInputElement;
  let form = {
    name: '',
    color: palette[0]
  };

  $: isCustomColor = !palette.includes(form.color);

  async function load() {
    try {
      categories = await api.categories.list();
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudieron cargar las categorias';
    }
  }

  async function createCategory() {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await api.categories.update(editingId, { name: form.name, color: form.color });
        showToast('Categoria actualizada', 'success');
      } else {
        await api.categories.create({ name: form.name, color: form.color });
        showToast('Categoria creada', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar la categoria', 'error');
    }
  }

  function editCategory(category: Category) {
    editingId = category.id;
    form = {
      name: category.name,
      color: category.color ?? palette[0]
    };
  }

  function resetForm() {
    editingId = null;
    form = {
      name: '',
      color: palette[0]
    };
  }

  async function removeCategory(category: Category) {
    if (!confirm(`Eliminar la categoria "${category.name}"?`)) return;

    try {
      await api.categories.remove(category.id);
      showToast('Categoria eliminada', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar la categoria';
      error = message;
      showToast(message, 'error');
    }
  }

  load();
</script>

<svelte:head>
  <title>Categorias | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="erp-header">
    <div class="min-w-0">
      <p class="eyebrow">Clasificacion</p>
      <h1 class="erp-title">Categorias</h1>
    </div>
    <p class="max-w-xl text-sm font-bold leading-6 text-ink-500">
      Una buena taxonomia reduce ruido. Usa pocas categorias, colores reconocibles y nombres accionables.
    </p>
  </header>

  {#if error}
    <p class="erp-error">{error}</p>
  {/if}

  <section class="erp-card">
    <div class="erp-card-header">
      <h2 class="erp-card-title">{editingId ? 'Editar categoria' : 'Nueva categoria'}</h2>
      {#if editingId}
        <button class="erp-button-secondary !min-h-9" type="button" on:click={resetForm}>
          <X size={16} strokeWidth={2.5} />
          Cancelar
        </button>
      {/if}
    </div>
    <form class="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(14rem,1fr)_auto_auto] lg:items-end" on:submit|preventDefault={createCategory}>
      <label class="erp-field">
        <span class="erp-label">Nombre</span>
        <input class="erp-input" bind:value={form.name} maxlength="80" placeholder="Comida, Transporte, Salud..." />
      </label>
      <div class="erp-field">
        <span class="erp-label">Color</span>
        <div class="flex min-h-10 flex-wrap items-center gap-2">
          {#each palette as color}
            <button
              aria-label={`Usar color ${color}`}
              class={[
                'size-8 rounded-full border-2 transition',
                form.color === color ? 'border-ink-950 shadow-[0_0_0_4px_rgb(23_33_31/0.08)]' : 'border-white'
              ]}
              style={`background: ${color}`}
              type="button"
              on:click={() => (form.color = color)}
            ></button>
          {/each}
          <button
            aria-label="Elegir color personalizado"
            class={[
              'size-8 rounded-full border-2 transition',
              isCustomColor ? 'border-ink-950 shadow-[0_0_0_4px_rgb(23_33_31/0.08)]' : 'border-white'
            ]}
            style="background: conic-gradient(from 90deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ef4444)"
            type="button"
            on:click={() => customColorInput.click()}
          ></button>
          <input
            aria-label="Color personalizado"
            bind:this={customColorInput}
            class="sr-only"
            type="color"
            value={form.color}
            on:input={(event) => (form.color = event.currentTarget.value)}
          />
        </div>
      </div>
      <button class="erp-button w-full lg:w-auto" type="submit">
        {#if editingId}
          <Pencil size={17} strokeWidth={2.6} />
          Guardar
        {:else}
          <Plus size={17} strokeWidth={2.6} />
          Crear
        {/if}
      </button>
    </form>
  </section>

  {#if categories.length === 0}
    <div class="erp-card erp-empty">Aun no hay categorias.</div>
  {:else}
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each categories as category}
        <article class="erp-card grid grid-cols-[auto_minmax(0,1fr)] gap-4 p-4 sm:flex sm:items-center">
          <span class="grid size-12 shrink-0 place-items-center rounded-[8px] text-sm font-black text-white" style={`background: ${category.color ?? '#888888'}`}>
            {category.name.slice(0, 2).toUpperCase()}
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-lg font-black text-ink-950">{category.name}</h2>
            <p class="mt-1 text-xs font-black uppercase tracking-[0.08em] text-ink-500">{category.color}</p>
          </div>
          <div class="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:shrink-0">
            <button class="erp-button-secondary !min-h-9 !px-2.5" type="button" on:click={() => editCategory(category)} aria-label="Editar categoria">
              <Pencil size={16} strokeWidth={2.5} />
            </button>
            <button class="erp-button-danger !min-h-9 !px-2.5" type="button" on:click={() => removeCategory(category)} aria-label="Eliminar categoria">
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        </article>
      {/each}
    </section>
  {/if}
</section>
