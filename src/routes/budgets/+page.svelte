<script lang="ts">
  import MonthInput from '$lib/components/MonthInput.svelte';
  import { api, currentMonthValue, formatMoney, type BudgetUsage, type Category } from '$lib/rpc/client';
  import { formatPeriodMonth } from '$lib/dates';
  import { showToast } from '$lib/stores/toasts';
  import { preferences } from '$lib/stores/preferences';
  import { AlertTriangle, CheckCircle2, Pencil, Plus, Target, Trash2, X } from '@lucide/svelte';

  let usage: BudgetUsage | null = null;
  let categories: Category[] = [];
  let error = '';
  let editingBudgetId: number | null = null;
  let saving = false;
  let form = {
    categoryId: '',
    amount: '',
    month: currentMonthValue()
  };

  $: usageItems = usage?.items ?? [];
  $: warningCount = usageItems.filter((item) => item.status === 'warning').length;
  $: exceededCount = usageItems.filter((item) => item.status === 'exceeded').length;

  function statusLabel(status: BudgetUsage['items'][number]['status']) {
    if (status === 'exceeded') return 'Excedido';
    if (status === 'warning') return 'Cerca del limite';
    return 'Bajo control';
  }

  function statusClasses(status: BudgetUsage['items'][number]['status']) {
    if (status === 'exceeded') return 'border-red-200 bg-red-50 text-red-800';
    if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  function progressColor(status: BudgetUsage['items'][number]['status']) {
    if (status === 'exceeded') return '#b91c1c';
    if (status === 'warning') return '#d97706';
    return '#0077B6';
  }

  async function load() {
    error = '';
    try {
      [usage, categories] = await Promise.all([
        api.analytics.budgetUsage({ month: Number(form.month), startDay: Number($preferences.monthStart) }),
        api.categories.list()
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudieron cargar los presupuestos';
    }
  }

  async function saveBudget() {
    if (!form.categoryId || !Number(form.amount)) {
      error = 'Selecciona categoria e ingresa monto';
      return;
    }

    saving = true;
    error = '';

    try {
      const payload = {
        categoryId: Number(form.categoryId),
        amount: Math.round(Number(form.amount) * 100),
        month: Number(form.month)
      };

      if (editingBudgetId) {
        await api.budgets.update(editingBudgetId, payload);
        showToast('Presupuesto actualizado', 'success');
      } else {
        await api.budgets.create(payload);
        showToast('Presupuesto creado', 'success');
      }

      resetForm();
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el presupuesto';
      error = message;
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  function editBudget(item: BudgetUsage['items'][number]) {
    editingBudgetId = item.budgetId;
    form = {
      categoryId: String(item.categoryId),
      amount: String(item.budget / 100),
      month: usage?.month ?? currentMonthValue()
    };
  }

  function resetForm() {
    editingBudgetId = null;
    form = {
      categoryId: '',
      amount: '',
      month: usage?.month ?? currentMonthValue()
    };
  }

  async function removeBudget(item: BudgetUsage['items'][number]) {
    if (!confirm(`Eliminar el presupuesto de "${item.categoryName}"?`)) return;

    try {
      await api.budgets.remove(item.budgetId);
      showToast('Presupuesto eliminado', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el presupuesto';
      error = message;
      showToast(message, 'error');
    }
  }

  load();
</script>

<svelte:head>
  <title>Presupuestos | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="erp-header">
    <div class="min-w-0">
      <p class="eyebrow">Plan mensual</p>
      <h1 class="erp-title">Presupuestos</h1>
    </div>
    <div class="flex w-full flex-wrap items-center gap-2 md:w-auto">
      <label class="erp-field w-full min-w-0 sm:w-48">
        <span class="erp-label">Mes</span>
        <MonthInput bind:value={form.month} onChange={load} />
      </label>
    </div>
  </header>

  {#if error}
    <p class="erp-error">{error}</p>
  {/if}

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <section class="erp-card p-4">
      <p class="text-sm font-black text-ink-500">Presupuesto total</p>
      <strong class="mt-3 block truncate text-2xl font-black text-ink-950 sm:text-3xl">{formatMoney(usage?.totalBudget ?? 0, $preferences.currency)}</strong>
    </section>
    <section class="erp-card p-4">
      <p class="text-sm font-black text-ink-500">Gastado</p>
      <strong class="mt-3 block truncate text-2xl font-black text-ink-950 sm:text-3xl">{formatMoney(usage?.totalSpent ?? 0, $preferences.currency)}</strong>
    </section>
    <section class="erp-card p-4">
      <p class="text-sm font-black text-ink-500">Restante</p>
      <strong class={['mt-3 block truncate text-2xl font-black sm:text-3xl', (usage?.totalRemaining ?? 0) < 0 ? 'text-red-700' : 'text-ink-950']}>
        {formatMoney(usage?.totalRemaining ?? 0, $preferences.currency)}
      </strong>
    </section>
    <section class="erp-card p-4">
      <p class="text-sm font-black text-ink-500">Alertas</p>
      <strong class="mt-3 block text-3xl font-black text-ink-950">{warningCount + exceededCount}</strong>
      <p class="mt-1 text-xs font-bold text-ink-500">{exceededCount} excedidos, {warningCount} cerca</p>
    </section>
  </div>

  <section class="erp-card">
    <div class="erp-card-header">
      <h2 class="erp-card-title">{editingBudgetId ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h2>
      {#if editingBudgetId}
        <button class="erp-button-secondary !min-h-9" type="button" on:click={resetForm}>
          <X size={16} strokeWidth={2.5} />
          Cancelar
        </button>
      {/if}
    </div>
    <form class="grid gap-3 p-3 sm:p-4 md:grid-cols-[minmax(13rem,1fr)_10rem] lg:grid-cols-[minmax(13rem,1fr)_10rem_auto] lg:items-end" on:submit|preventDefault={saveBudget}>
      <label class="erp-field">
        <span class="erp-label">Categoria</span>
        <select class="erp-input" bind:value={form.categoryId}>
          <option value="">Seleccionar</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </label>
      <label class="erp-field">
        <span class="erp-label">Monto {$preferences.currency}</span>
        <input class="erp-input" bind:value={form.amount} min="1" type="number" placeholder="350000" />
      </label>
      <button class="erp-button w-full md:col-span-2 lg:col-span-1" disabled={saving} type="submit">
        {#if editingBudgetId}
          <Pencil size={17} strokeWidth={2.6} />
          {saving ? 'Guardando' : 'Actualizar'}
        {:else}
          <Plus size={17} strokeWidth={2.6} />
          {saving ? 'Guardando' : 'Crear'}
        {/if}
      </button>
    </form>
  </section>

  {#if usageItems.length === 0}
    <section class="erp-card erp-empty">
      <div>
        <span class="mx-auto grid size-12 place-items-center rounded-[8px] bg-forest-600/10 text-forest-600">
          <Target size={22} strokeWidth={2.4} />
        </span>
        <h2 class="mt-4 text-lg font-black text-ink-950">No hay presupuestos para este mes</h2>
        <p class="mt-2 max-w-md text-sm font-semibold leading-6 text-ink-500">
          Crea presupuestos por categoria para medir gasto, restante y alertas automaticamente.
        </p>
      </div>
    </section>
  {:else}
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {#each usageItems as item}
        <article class="erp-card p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="size-3 rounded-full" style={`background: ${item.color ?? '#0077B6'}`}></span>
                <h2 class="truncate text-lg font-black text-ink-950">{item.categoryName}</h2>
              </div>
              <p class="mt-1 text-sm font-semibold text-ink-500">Mes {formatPeriodMonth(usage?.month)}</p>
            </div>
            <span class={['inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black', statusClasses(item.status)]}>
              {#if item.status === 'ok'}
                <CheckCircle2 size={14} strokeWidth={2.4} />
              {:else}
                <AlertTriangle size={14} strokeWidth={2.4} />
              {/if}
              {statusLabel(item.status)}
            </span>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-3 rounded-[8px] bg-paper-100/70 p-3 sm:grid-cols-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Plan</p>
              <p class="mt-1 text-sm font-black text-ink-950">{formatMoney(item.budget, $preferences.currency)}</p>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Gasto</p>
              <p class="mt-1 text-sm font-black text-ink-950">{formatMoney(item.spent, $preferences.currency)}</p>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Resta</p>
              <p class={['mt-1 text-sm font-black', item.remaining < 0 ? 'text-red-700' : 'text-ink-950']}>{formatMoney(item.remaining, $preferences.currency)}</p>
            </div>
          </div>

          <div class="mt-5">
            <div class="flex items-center justify-between text-sm font-black text-ink-700">
              <span>Consumo</span>
              <span>{item.percent}%</span>
            </div>
            <div class="mt-2 h-3 overflow-hidden rounded-full bg-paper-100">
              <span
                class="block h-full rounded-full"
                style={`width: ${Math.min(item.percent, 100)}%; background: ${progressColor(item.status)}`}
              ></span>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
            <button class="erp-button-secondary !min-h-9" type="button" on:click={() => editBudget(item)}>
              <Pencil size={16} strokeWidth={2.5} />
              Editar
            </button>
            <button class="erp-button-danger !min-h-9" type="button" on:click={() => removeBudget(item)}>
              <Trash2 size={16} strokeWidth={2.5} />
              Eliminar
            </button>
          </div>
        </article>
      {/each}
    </section>
  {/if}
</section>
