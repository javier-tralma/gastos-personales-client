<script lang="ts">
  import DonutChart from '$lib/components/DonutChart.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import FlowChart from '$lib/components/FlowChart.svelte';
  import MetricPanel from '$lib/components/MetricPanel.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import { formatCalendarDate, formatPeriodMonth } from '$lib/dates';
  import { preferences } from '$lib/stores/preferences';
  import {
    api,
    formatMoney,
    type Category,
    type CategorySpend,
    type Summary,
    type Transaction,
    type WeeklyFlow
  } from '$lib/rpc/client';
  import {
    AlertTriangle,
    BarChart3,
    CalendarDays,
    FolderKanban,
    PieChart,
    Plus,
    ReceiptText,
    WalletCards
  } from '@lucide/svelte';

  let summary: Summary | null = null;
  let categories: Category[] = [];
  let transactions: Transaction[] = [];
  let weeklyFlow: WeeklyFlow | null = null;
  let categorySpend: CategorySpend | null = null;
  let loading = true;
  let error = '';
  let appliedStartDay = '';

  $: selectedStartDay = $preferences.monthStart;
  $: topTransactions = transactions.slice(0, 6);
  $: budgetUsed =
    summary && summary.budget > 0 ? Math.min(140, Math.round((summary.expense / summary.budget) * 100)) : 0;
  $: budgetProgress = Math.min(100, budgetUsed);
  $: budgetStatus =
    !summary?.budget ? 'Sin presupuesto' : budgetUsed >= 100 ? 'Excedido' : budgetUsed >= 80 ? 'Atencion' : 'Saludable';
  $: budgetTone = !summary?.budget ? 'neutral' : budgetUsed >= 100 ? 'danger' : budgetUsed >= 80 ? 'warn' : 'good';
  $: budgetStatusText =
    !summary?.budget
      ? 'Define un presupuesto para medir el margen real del periodo.'
      : budgetUsed >= 100
        ? 'El gasto ya supero el presupuesto definido.'
        : budgetUsed >= 80
          ? 'El gasto esta entrando en zona de atencion.'
          : 'El gasto se mantiene bajo el presupuesto.';
  $: categoryMap = new Map(categories.map((category) => [category.id, category]));
  $: categoryTotals = categorySpend?.categories ?? [];
  $: totalExpense = categoryTotals.reduce((sum, item) => sum + item.amount, 0);
  $: topCategory = categoryTotals[0];
  $: topCategoryShare = topCategory && totalExpense > 0 ? Math.round((topCategory.amount / totalExpense) * 100) : 0;
  $: periodStats = summary ? getPeriodStats(summary.month, Number(selectedStartDay)) : null;
  $: averageDailyExpense =
    summary && periodStats ? Math.round(summary.expense / Math.max(periodStats.elapsedDays, 1)) : 0;
  $: dailyAvailable =
    summary && periodStats ? Math.round(summary.remainingBudget / Math.max(periodStats.remainingDays, 1)) : 0;
  $: netDirection = (summary?.balance ?? 0) >= 0 ? 'Positivo' : 'Negativo';
  $: hasFlowData = Boolean(weeklyFlow?.points.some((point) => point.income > 0 || point.expense > 0));
  $: hasCategoryExpenseData = categoryTotals.length > 0;

  function getCategory(id: number | null) {
    return id ? categoryMap.get(id) : null;
  }

  function getPeriodStats(month: number, startDay: number) {
    const year = Math.floor(month / 100);
    const monthIndex = (month % 100) - 1;
    const start = new Date(year, monthIndex, startDay);
    const end = new Date(year, monthIndex + 1, startDay, 0, 0, 0, -1);
    const now = new Date();
    const dayMs = 1000 * 60 * 60 * 24;
    const elapsedDays = Math.max(1, Math.ceil((Math.min(now.getTime(), end.getTime()) - start.getTime()) / dayMs));
    const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / dayMs));

    return { start, end, elapsedDays, remainingDays };
  }

  async function load() {
    loading = true;
    error = '';
    appliedStartDay = selectedStartDay;
    const periodOptions = { startDay: Number(selectedStartDay) };

    try {
      [summary, categories, transactions, weeklyFlow, categorySpend] = await Promise.all([
        api.summary(periodOptions),
        api.categories.list(),
        api.transactions.list(),
        api.analytics.weeklyFlow(periodOptions),
        api.analytics.categorySpend(periodOptions)
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo cargar el dashboard';
    } finally {
      loading = false;
    }
  }

  $: if (!loading && selectedStartDay !== appliedStartDay) {
    load();
  }

  load();
</script>

<svelte:head>
  <title>Dashboard | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="flex flex-col gap-3 rounded-[8px] border border-paper-200/90 bg-paper-50/92 px-3 py-3 shadow-[0_12px_32px_rgb(15_23_42/0.045)] backdrop-blur sm:px-4 md:flex-row md:items-center md:justify-between">
    <div class="min-w-0">
      <p class="eyebrow">Control financiero personal</p>
      <div class="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
        <h1 class="text-2xl font-black leading-none text-ink-950 sm:text-3xl">Vista del periodo</h1>
        <span class="pb-0.5 text-sm font-black text-ink-500">{summary ? formatPeriodMonth(summary.month) : 'Sin datos'}</span>
      </div>
    </div>
    <div class="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      <StatusPill tone={!summary?.budget ? 'neutral' : budgetUsed >= 80 ? 'warn' : 'good'}>
        {budgetStatus}
      </StatusPill>
      <a class="erp-button" href="/transactions">
        <Plus size={17} strokeWidth={2.6} />
        Movimiento
      </a>
    </div>
  </header>

  {#if error}
    <p class="erp-error">{error}</p>
  {/if}

  {#if loading}
    <div class="erp-card erp-empty">Preparando lectura financiera...</div>
  {:else}
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(24rem,0.75fr)]">
      <div
        class={[
          'erp-card overflow-hidden border-l-4',
          budgetTone === 'danger' && 'border-l-red-600',
          budgetTone === 'warn' && 'border-l-amber-500',
          budgetTone === 'good' && 'border-l-forest-600',
          budgetTone === 'neutral' && 'border-l-paper-200'
        ]}
      >
        <div class="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:p-6">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-paper-200 bg-paper-100/70 px-3 py-1 text-xs font-black text-ink-700">
                {periodStats?.remainingDays ?? 0} dias restantes
              </span>
              <span class="rounded-full border border-paper-200 bg-paper-100/70 px-3 py-1 text-xs font-black text-ink-700">
                Inicio dia {selectedStartDay}
              </span>
            </div>
            <p class="mt-6 text-sm font-black uppercase tracking-[0.12em] text-ink-500">Disponible del periodo</p>
            <strong class="mt-2 block break-words text-[clamp(2.35rem,12vw,5rem)] font-black leading-[0.95] text-ink-950">
              {formatMoney(summary?.remainingBudget ?? 0, $preferences.currency)}
            </strong>
            <p class="mt-4 max-w-2xl text-sm font-bold leading-6 text-ink-500">
              {#if summary?.budget}
                {budgetStatusText} Puedes gastar aprox.
                <span class="font-black text-ink-900">{formatMoney(dailyAvailable, $preferences.currency)}</span>
                por dia para cerrar el periodo dentro de presupuesto.
              {:else}
                Agrega un presupuesto mensual para transformar este tablero en una lectura de margen, ritmo y riesgo financiero.
              {/if}
            </p>
          </div>

          <div class="grid content-between gap-4 rounded-[8px] border border-paper-200 bg-paper-100/55 p-4">
            <div>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.10em] text-ink-500">Presupuesto usado</p>
                  <strong class="mt-2 block text-4xl font-black leading-none text-ink-950">{budgetUsed}%</strong>
                </div>
                <span
                  class={[
                    'rounded-full px-3 py-1 text-xs font-black',
                    budgetTone === 'danger' && 'bg-red-600/10 text-red-700',
                    budgetTone === 'warn' && 'bg-amber-500/15 text-amber-700',
                    budgetTone === 'good' && 'bg-forest-600/10 text-forest-600',
                    budgetTone === 'neutral' && 'bg-paper-50 text-ink-500'
                  ]}
                >
                  {budgetStatus}
                </span>
              </div>
              <div class="mt-5 h-2.5 overflow-hidden rounded-full bg-paper-200/75">
                <span
                  class={[
                    'block h-full rounded-full',
                    budgetTone === 'danger' && 'bg-red-600',
                    budgetTone === 'warn' && 'bg-amber-500',
                    budgetTone === 'good' && 'bg-forest-600',
                    budgetTone === 'neutral' && 'bg-ink-500/35'
                  ]}
                  style={`width: ${budgetProgress}%`}
                ></span>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <div>
                <p class="font-black text-ink-500">Presupuesto</p>
                <p class="mt-1 truncate font-black text-ink-950">{formatMoney(summary?.budget ?? 0, $preferences.currency)}</p>
              </div>
              <div>
                <p class="font-black text-ink-500">Gasto diario</p>
                <p class="mt-1 truncate font-black text-ink-950">{formatMoney(averageDailyExpense, $preferences.currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="grid gap-4">
        <MetricPanel
          label="Gasto del mes"
          value={formatMoney(summary?.expense ?? 0, $preferences.currency)}
          meta={summary?.budget ? `${budgetUsed}% del presupuesto` : 'Sin presupuesto activo'}
          accent="#475569"
        />
        <MetricPanel
          label="Balance neto"
          value={formatMoney(summary?.balance ?? 0, $preferences.currency)}
          meta={`${netDirection} contra ingresos y egresos`}
          accent={(summary?.balance ?? 0) >= 0 ? '#0077B6' : '#DC2626'}
        />
      </aside>
    </section>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <MetricPanel
        label="Ingresos"
        value={formatMoney(summary?.income ?? 0, $preferences.currency)}
        meta="Entradas registradas"
        accent="#0077B6"
      />
      <MetricPanel
        label="Categoria dominante"
        value={topCategory ? topCategory.name : 'Sin datos'}
        meta={topCategory ? `${topCategoryShare}% del gasto categorizado` : 'Asigna categorias para medir concentracion'}
        accent={topCategory?.color ?? '#00B4D8'}
      />
      <MetricPanel
        label="Actividad reciente"
        value={`${transactions.length}`}
        meta={transactions.length === 1 ? 'movimiento registrado' : 'movimientos registrados'}
        accent="#00B4D8"
      />
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(24rem,0.85fr)]">
      <section class="erp-card">
        <div class="erp-card-header">
          <div>
            <h2 class="erp-card-title">Ritmo semanal</h2>
            <p class="mt-1 text-xs font-semibold text-ink-500">Entradas y salidas dentro del periodo</p>
          </div>
          <span class="rounded-full border border-paper-200 bg-paper-50 px-3 py-1 text-xs font-black text-ink-500">
            Mes {formatPeriodMonth(weeklyFlow?.month)}
          </span>
        </div>

        {#if hasFlowData}
          <FlowChart points={weeklyFlow?.points ?? []} currency={$preferences.currency} />
        {:else}
          <EmptyState
            icon={BarChart3}
            title="Aun no hay ritmo financiero"
            description="Registra movimientos con fecha para ver en que dias se concentra el gasto."
            primaryHref="/transactions"
            primaryLabel="Agregar movimiento"
          />
        {/if}
      </section>

      <section class="erp-card">
        <div class="erp-card-header">
          <div>
            <h2 class="erp-card-title">Gasto por categoria</h2>
            <p class="mt-1 text-xs font-semibold text-ink-500">
              {topCategory ? `${topCategory.name} concentra ${topCategoryShare}%` : 'Distribucion mensual'}
            </p>
          </div>
          {#if topCategory}
            <span class="rounded-full border border-paper-200 bg-paper-50 px-3 py-1 text-xs font-black text-ink-700">
              Top
            </span>
          {/if}
        </div>

        {#if hasCategoryExpenseData}
          <DonutChart items={categoryTotals} total={totalExpense || summary?.expense || 0} currency={$preferences.currency} />
        {:else}
          <EmptyState
            icon={PieChart}
            title="Sin gasto categorizado"
            description="Crea categorias y asigna gastos para detectar concentracion y prioridades."
            secondaryHref="/categories"
            secondaryLabel="Crear categoria"
            primaryHref="/transactions"
            primaryLabel="Agregar gasto"
          />
        {/if}
      </section>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(24rem,0.85fr)]">
      <section class="erp-card">
        <div class="erp-card-header">
          <div>
            <h2 class="erp-card-title">Movimientos recientes</h2>
            <p class="mt-1 text-xs font-semibold text-ink-500">Ultimas operaciones que afectan el periodo</p>
          </div>
          <a class="erp-button-secondary" href="/transactions">
            <WalletCards size={16} strokeWidth={2.5} />
            Ver todos
          </a>
        </div>
        {#if topTransactions.length === 0}
          <EmptyState
            icon={ReceiptText}
            title="Aun no hay movimientos"
            description="Agrega el primer ingreso o gasto para activar balance, ritmo y presupuesto."
            primaryHref="/transactions"
            primaryLabel="Agregar movimiento"
          />
        {:else}
          <div class="erp-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripcion</th>
                  <th>Categoria</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {#each topTransactions as transaction}
                  <tr class="transition hover:bg-paper-100/70">
                    <td>{formatCalendarDate(transaction.date)}</td>
                    <td>
                      <a class="font-black text-ink-950 transition hover:text-forest-600" href={`/transactions/${transaction.id}`}>
                        {transaction.description || 'Sin descripcion'}
                      </a>
                    </td>
                    <td>
                      {#if getCategory(transaction.categoryId)}
                        <span class="inline-flex max-w-[14rem] items-center gap-2">
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
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>

      <section class="erp-card">
        <div class="erp-card-header">
          <div>
            <h2 class="erp-card-title">Taxonomia</h2>
            <p class="mt-1 text-xs font-semibold text-ink-500">{categories.length} categorias activas</p>
          </div>
          <a class="erp-button-secondary" href="/categories">Gestionar</a>
        </div>
        {#if categories.length === 0}
          <EmptyState
            icon={FolderKanban}
            title="Define tus categorias"
            description="Ordena tus movimientos por areas de gasto para que el tablero entregue lecturas accionables."
            primaryHref="/categories"
            primaryLabel="Crear categoria"
          />
        {:else}
          <div class="grid gap-2 p-4">
            {#each categories.slice(0, 7) as category}
              <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[8px] border border-paper-200 bg-paper-50 px-3 py-2">
                <span class="flex min-w-0 items-center gap-2 text-sm font-black">
                  <span class="size-3 shrink-0 rounded-full" style={`background: ${category.color ?? '#888888'}`}></span>
                  <span class="truncate">{category.name}</span>
                </span>
                <span class="text-xs font-black text-ink-500">#{category.id}</span>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </section>

    {#if summary?.budget && budgetUsed >= 80}
      <section class="erp-card flex flex-col gap-3 border-amber-500/35 bg-amber-500/8 p-4 text-amber-800 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-[8px] bg-amber-500/15">
            <AlertTriangle size={18} strokeWidth={2.4} />
          </span>
          <div>
            <h2 class="text-sm font-black text-ink-950">Atencion presupuestaria</h2>
            <p class="mt-1 text-sm font-bold leading-6 text-ink-700">{budgetStatusText}</p>
          </div>
        </div>
        <a class="erp-button-secondary bg-paper-50" href="/budgets">
          <CalendarDays size={16} strokeWidth={2.4} />
          Revisar presupuesto
        </a>
      </section>
    {/if}
  {/if}
</section>
