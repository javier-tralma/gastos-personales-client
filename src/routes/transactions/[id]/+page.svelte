<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import { formatCalendarDate } from '$lib/dates';
  import { api, formatMoney, type Category, type Transaction } from '$lib/rpc/client';
  import { preferences } from '$lib/stores/preferences';
  import { showToast } from '$lib/stores/toasts';
  import { ArrowLeft, CalendarDays, CreditCard, FolderKanban, Pencil, Trash2 } from '@lucide/svelte';

  let transaction: Transaction | null = null;
  let categories: Category[] = [];
  let loading = true;
  let error = '';

  $: category = transaction?.categoryId ? categories.find((item) => item.id === transaction?.categoryId) : null;
  $: transactionKind = transaction && transaction.amount > 0 ? 'Ingreso' : 'Gasto';

  function getTransactionId() {
    const fromParams = $page.params.id;
    const fromPath = $page.url.pathname.split('/').filter(Boolean).pop();
    return Number(fromParams ?? fromPath);
  }

  async function load() {
    loading = true;
    error = '';
    const transactionId = getTransactionId();

    if (!Number.isFinite(transactionId) || transactionId <= 0) {
      error = 'Ruta de movimiento invalida';
      loading = false;
      return;
    }

    try {
      [transaction, categories] = await Promise.all([
        api.transactions.get(transactionId),
        api.categories.list()
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo cargar el movimiento';
    } finally {
      loading = false;
    }
  }

  async function removeTransaction() {
    if (!transaction) return;
    if (!confirm(`Eliminar el movimiento "${transaction.description || 'Sin descripcion'}"?`)) return;

    try {
      await api.transactions.remove(transaction.id);
      showToast('Movimiento eliminado', 'success');
      await goto('/transactions');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el movimiento';
      error = message;
      showToast(message, 'error');
    }
  }

  load();
</script>

<svelte:head>
  <title>Detalle movimiento | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="erp-header">
    <div class="min-w-0">
      <p class="eyebrow">Libro diario</p>
      <h1 class="erp-title">Detalle movimiento</h1>
    </div>
    <div class="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      <a class="erp-button-secondary" href="/transactions">
        <ArrowLeft size={16} strokeWidth={2.5} />
        Volver
      </a>
      {#if transaction}
        <a class="erp-button-secondary" href={`/transactions?edit=${transaction.id}`}>
          <Pencil size={16} strokeWidth={2.5} />
          Editar
        </a>
        <button class="erp-button-danger !min-h-10" type="button" on:click={removeTransaction}>
          <Trash2 size={16} strokeWidth={2.5} />
          Eliminar
        </button>
      {/if}
    </div>
  </header>

  {#if error}
    <p class="erp-error">{error}</p>
  {/if}

  {#if loading}
    <section class="erp-card erp-empty">Cargando movimiento...</section>
  {:else if transaction}
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <article class="erp-card p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <StatusPill tone={transaction.amount > 0 ? 'good' : 'warn'}>{transactionKind}</StatusPill>
            <h2 class="mt-4 break-words text-3xl font-black text-ink-950">
              {transaction.description || 'Sin descripcion'}
            </h2>
            <p class="mt-2 text-sm font-bold text-ink-500">Movimiento #{transaction.id}</p>
          </div>
          <strong class={['break-words text-3xl font-black leading-none sm:text-4xl', transaction.amount > 0 ? 'text-emerald-700' : 'text-red-700']}>
            {formatMoney(transaction.amount, $preferences.currency)}
          </strong>
        </div>

        <div class="mt-8 grid gap-3 lg:grid-cols-3">
          <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
            <div class="flex items-center gap-2 text-sm font-black text-ink-950">
              <CalendarDays size={17} strokeWidth={2.4} />
              Fecha
            </div>
            <p class="mt-2 text-lg font-black text-ink-950">{formatCalendarDate(transaction.date)}</p>
          </div>
          <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
            <div class="flex items-center gap-2 text-sm font-black text-ink-950">
              <FolderKanban size={17} strokeWidth={2.4} />
              Categoria
            </div>
            <p class="mt-2 inline-flex min-w-0 items-center gap-2 text-lg font-black text-ink-950">
              {#if category}
                <span class="size-3 rounded-full" style={`background: ${category.color ?? '#888888'}`}></span>
                <span class="truncate">{category.name}</span>
              {:else}
                Sin categoria
              {/if}
            </p>
          </div>
          <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
            <div class="flex items-center gap-2 text-sm font-black text-ink-950">
              <CreditCard size={17} strokeWidth={2.4} />
              Registro
            </div>
            <p class="mt-2 text-lg font-black text-ink-950">{transactionKind}</p>
          </div>
        </div>
      </article>

      <aside class="erp-card">
        <div class="erp-card-header">
          <h2 class="erp-card-title">Resumen</h2>
        </div>
        <div class="grid gap-3 p-4">
          <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
            <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Monto firmado</p>
            <p class={['mt-1 text-xl font-black', transaction.amount > 0 ? 'text-emerald-700' : 'text-red-700']}>{formatMoney(transaction.amount, $preferences.currency)}</p>
          </div>
          <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
            <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Fecha contable</p>
            <p class="mt-1 text-xl font-black text-ink-950">{formatCalendarDate(transaction.date)}</p>
          </div>
          <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
            <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Categoria</p>
            <p class="mt-1 text-xl font-black text-ink-950">{category?.name ?? 'Sin categoria'}</p>
          </div>
        </div>
      </aside>
    </section>
  {:else}
    <section class="erp-card erp-empty">No se encontro el movimiento solicitado.</section>
  {/if}
</section>
