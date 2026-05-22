<script lang="ts">
  import { page } from '$app/stores';
  import CalendarInput from '$lib/components/CalendarInput.svelte';
  import { api, formatMoney, type Category, type Transaction } from '$lib/rpc/client';
  import { dateInputValue, formatCalendarDate, todayInputValue } from '$lib/dates';
  import { preferences } from '$lib/stores/preferences';
  import { showToast } from '$lib/stores/toasts';
  import { Eye, FilterX, Pencil, Plus, Search, Trash2, X } from '@lucide/svelte';

  let categories: Category[] = [];
  let transactions: Transaction[] = [];
  let error = '';
  let loading = true;
  let saving = false;
  let editingId: number | null = null;
  let appliedEditId = '';
  let filters = {
    search: '',
    type: '',
    categoryId: '',
    from: '',
    to: ''
  };

  let form = {
    type: 'expense',
    categoryId: '',
    amount: '',
    description: '',
    date: todayInputValue()
  };

  $: categoryMap = new Map(categories.map((category) => [category.id, category]));
  $: requestedEditId = $page.url.searchParams.get('edit') ?? '';
  $: if (requestedEditId && requestedEditId !== appliedEditId && transactions.length > 0) {
    const transaction = transactions.find((item) => item.id === Number(requestedEditId));
    if (transaction) {
      editTransaction(transaction);
      appliedEditId = requestedEditId;
    }
  }

  function getCategory(id: number | null) {
    return id ? categoryMap.get(id) : null;
  }

  async function load() {
    loading = true;
    error = '';
    try {
      [categories, transactions] = await Promise.all([api.categories.list(), api.transactions.list(filters)]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudieron cargar los movimientos';
    } finally {
      loading = false;
    }
  }

  function clearFilters() {
    filters = {
      search: '',
      type: '',
      categoryId: '',
      from: '',
      to: ''
    };
    load();
  }

  async function saveTransaction() {
    const pesos = Number(form.amount);

    if (!pesos || pesos <= 0) {
      error = 'Ingresa un monto mayor a cero';
      return;
    }

    saving = true;
    error = '';

    try {
      const signedCents = Math.round(pesos * 100) * (form.type === 'expense' ? -1 : 1);
      const payload = {
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        amount: signedCents,
        description: form.description,
        date: form.date
      };

      if (editingId) {
        await api.transactions.update(editingId, payload);
        showToast('Movimiento actualizado', 'success');
      } else {
        await api.transactions.create(payload);
        showToast('Movimiento creado', 'success');
      }

      resetForm();
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el movimiento';
      error = message;
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  function editTransaction(transaction: Transaction) {
    editingId = transaction.id;
    form = {
      type: transaction.amount < 0 ? 'expense' : 'income',
      categoryId: transaction.categoryId ? String(transaction.categoryId) : '',
      amount: String(Math.abs(transaction.amount) / 100),
      description: transaction.description ?? '',
      date: dateInputValue(transaction.date)
    };
  }

  function resetForm() {
    editingId = null;
    form = {
      type: 'expense',
      categoryId: '',
      amount: '',
      description: '',
      date: todayInputValue()
    };
  }

  async function removeTransaction(transaction: Transaction) {
    if (!confirm(`Eliminar el movimiento "${transaction.description || 'Sin descripcion'}"?`)) return;

    try {
      await api.transactions.remove(transaction.id);
      showToast('Movimiento eliminado', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el movimiento';
      error = message;
      showToast(message, 'error');
    }
  }

  load();
</script>

<svelte:head>
  <title>Movimientos | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="erp-header">
    <div class="min-w-0">
      <p class="eyebrow">Libro diario</p>
      <h1 class="erp-title">Movimientos</h1>
    </div>
    <p class="max-w-xl text-sm font-bold leading-6 text-ink-500">
      Registra ingresos y gastos con categoria, fecha y descripcion. La tabla esta pensada para escaneo rapido y uso frecuente.
    </p>
  </header>

  {#if error}
    <p class="erp-error">{error}</p>
  {/if}

  <section class="erp-card">
    <div class="erp-card-header">
      <h2 class="erp-card-title">{editingId ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
      {#if editingId}
        <button class="erp-button-secondary !min-h-9" type="button" on:click={resetForm}>
          <X size={16} strokeWidth={2.5} />
          Cancelar
        </button>
      {/if}
    </div>
    <form class="grid gap-3 p-3 sm:p-4 lg:grid-cols-2 xl:grid-cols-[9rem_minmax(12rem,1fr)_10rem_10rem_minmax(14rem,1fr)_auto] xl:items-end" on:submit|preventDefault={saveTransaction}>
      <label class="erp-field">
        <span class="erp-label">Tipo</span>
        <select class="erp-input" bind:value={form.type}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
      </label>
      <label class="erp-field">
        <span class="erp-label">Categoria</span>
        <select class="erp-input" bind:value={form.categoryId}>
          <option value="">Sin categoria</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </label>
      <label class="erp-field">
        <span class="erp-label">Monto {$preferences.currency}</span>
        <input class="erp-input" bind:value={form.amount} inputmode="numeric" min="1" placeholder="12990" type="number" />
      </label>
      <label class="erp-field">
        <span class="erp-label">Fecha</span>
        <CalendarInput bind:value={form.date} />
      </label>
      <label class="erp-field">
        <span class="erp-label">Descripcion</span>
        <input class="erp-input" bind:value={form.description} maxlength="240" placeholder="Supermercado, sueldo, transporte..." />
      </label>
      <button class="erp-button w-full lg:col-span-2 xl:col-span-1" disabled={saving} type="submit">
        {#if editingId}
          <Pencil size={17} strokeWidth={2.6} />
          {saving ? 'Guardando' : 'Actualizar'}
        {:else}
          <Plus size={17} strokeWidth={2.6} />
          {saving ? 'Guardando' : 'Guardar'}
        {/if}
      </button>
    </form>
  </section>

  <section class="erp-card">
    <div class="erp-card-header">
      <h2 class="erp-card-title">Filtros</h2>
      <button class="erp-button-secondary" type="button" on:click={clearFilters}>
        <FilterX size={16} strokeWidth={2.5} />
        Limpiar
      </button>
    </div>
    <div class="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_10rem_minmax(12rem,1fr)_10rem_10rem_auto] xl:items-end">
      <label class="erp-field">
        <span class="erp-label">Busqueda</span>
        <input class="erp-input" bind:value={filters.search} placeholder="Descripcion..." />
      </label>
      <label class="erp-field">
        <span class="erp-label">Tipo</span>
        <select class="erp-input" bind:value={filters.type}>
          <option value="">Todos</option>
          <option value="expense">Gastos</option>
          <option value="income">Ingresos</option>
        </select>
      </label>
      <label class="erp-field">
        <span class="erp-label">Categoria</span>
        <select class="erp-input" bind:value={filters.categoryId}>
          <option value="">Todas</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </label>
      <label class="erp-field">
        <span class="erp-label">Desde</span>
        <CalendarInput bind:value={filters.from} placeholder="Desde" />
      </label>
      <label class="erp-field">
        <span class="erp-label">Hasta</span>
        <CalendarInput bind:value={filters.to} placeholder="Hasta" />
      </label>
      <button class="erp-button w-full md:col-span-2 xl:col-span-1" type="button" on:click={load}>
        <Search size={17} strokeWidth={2.6} />
        Filtrar
      </button>
    </div>
  </section>

  <section class="erp-card">
    <div class="erp-card-header">
      <h2 class="erp-card-title">Historial</h2>
      <span class="rounded-full border border-paper-200 bg-paper-50 px-3 py-1 text-xs font-black text-ink-500">{transactions.length} registros</span>
    </div>
    {#if loading}
      <div class="erp-empty">Cargando movimientos...</div>
    {:else if transactions.length === 0}
      <div class="erp-empty">No hay movimientos registrados.</div>
    {:else}
      <div class="erp-table-wrap">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripcion</th>
              <th>Categoria</th>
              <th class="text-right">Monto</th>
              <th class="w-40"></th>
            </tr>
          </thead>
          <tbody>
            {#each transactions as transaction}
              <tr class="transition hover:bg-paper-100/70">
                <td>{formatCalendarDate(transaction.date)}</td>
                <td>
                  <a class="font-black text-ink-950 transition hover:text-forest-600" href={`/transactions/${transaction.id}`}>
                    {transaction.description || 'Sin descripcion'}
                  </a>
                </td>
                <td>
                  {#if getCategory(transaction.categoryId)}
                    <span class="inline-flex max-w-[12rem] items-center gap-2">
                      <span class="size-3 shrink-0 rounded-full" style={`background: ${getCategory(transaction.categoryId)?.color ?? '#888888'}`}></span>
                      <span class="truncate">{getCategory(transaction.categoryId)?.name}</span>
                    </span>
                  {:else}
                    <span class="text-ink-500">Sin categoria</span>
                  {/if}
                </td>
                <td class={['text-right', transaction.amount > 0 ? 'text-emerald-700' : 'text-red-700']}>
                  {formatMoney(transaction.amount, $preferences.currency)}
                </td>
                <td>
                  <div class="flex justify-end gap-2">
                    <a class="erp-button-secondary !min-h-9 !px-2.5" href={`/transactions/${transaction.id}`} aria-label="Ver detalle">
                      <Eye size={16} strokeWidth={2.5} />
                    </a>
                    <button class="erp-button-secondary !min-h-9 !px-2.5" type="button" on:click={() => editTransaction(transaction)} aria-label="Editar movimiento">
                      <Pencil size={16} strokeWidth={2.5} />
                    </button>
                    <button class="erp-button-danger !min-h-9 !px-2.5" type="button" on:click={() => removeTransaction(transaction)} aria-label="Eliminar movimiento">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</section>
