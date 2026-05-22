<script lang="ts">
  import DonutChart from '$lib/components/DonutChart.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import FlowChart from '$lib/components/FlowChart.svelte';
  import MonthInput from '$lib/components/MonthInput.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import { formatCalendarDate, formatPeriodMonth } from '$lib/dates';
  import {
    api,
    currentMonthValue,
    formatMoney,
    type BudgetUsage,
    type CategorySpend,
    type Summary,
    type Transaction,
    type WeeklyFlow
  } from '$lib/rpc/client';
  import { preferences } from '$lib/stores/preferences';
  import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CalendarRange,
    FileText,
    PieChart,
    ReceiptText,
    Target,
    TrendingUp
  } from '@lucide/svelte';

  type TrendPoint = WeeklyFlow['points'][number];

  let selectedMonth = currentMonthValue();
  let summary: Summary | null = null;
  let categorySpend: CategorySpend | null = null;
  let budgetUsage: BudgetUsage | null = null;
  let transactions: Transaction[] = [];
  let trendPoints: TrendPoint[] = [];
  let loading = true;
  let error = '';
  let appliedKey = '';

  $: periodOptions = { month: selectedMonth, startDay: Number($preferences.monthStart) };
  $: currentKey = `${selectedMonth}:${$preferences.monthStart}`;
  $: categoryTotals = categorySpend?.categories ?? [];
  $: hasCategoryData = categoryTotals.length > 0;
  $: hasTrendData = trendPoints.some((point) => point.income > 0 || point.expense > 0);
  $: topExpenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))
    .slice(0, 5);
  $: topIncome = transactions
    .filter((transaction) => transaction.amount > 0)
    .sort((left, right) => right.amount - left.amount)[0];
  $: savingsRate = summary && summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : 0;
  $: budgetPercent =
    summary && summary.budget > 0 ? Math.round((summary.expense / summary.budget) * 100) : 0;
  $: mainInsight = buildInsight();
  $: strongestCategory = categoryTotals[0];

  function addMonths(value: number, delta: number) {
    const year = Math.floor(value / 100);
    const monthIndex = (value % 100) - 1;
    const next = new Date(year, monthIndex + delta, 1);
    return next.getFullYear() * 100 + next.getMonth() + 1;
  }

  function periodBounds(month: number, startDay: number) {
    const year = Math.floor(month / 100);
    const monthIndex = (month % 100) - 1;
    const start = new Date(year, monthIndex, startDay);
    const end = new Date(year, monthIndex + 1, startDay - 1);
    return {
      from: toInputDate(start),
      to: toInputDate(end)
    };
  }

  function toInputDate(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function trendLabel(month: number) {
    const year = String(Math.floor(month / 100)).slice(2);
    return `${String(month % 100).padStart(2, '0')}/${year}`;
  }

  function buildInsight() {
    if (!summary) return 'Aun no hay informacion suficiente para emitir una lectura.';
    if (summary.income === 0 && summary.expense === 0) {
      return 'Este periodo aun no tiene movimientos. Agrega ingresos y gastos para activar el reporte.';
    }
    if (summary.balance >= 0 && budgetPercent <= 80) {
      return 'El periodo se mantiene saludable: balance positivo y consumo de presupuesto bajo control.';
    }
    if (summary.balance >= 0) {
      return 'Hay balance positivo, pero el presupuesto ya exige seguimiento cercano.';
    }
    return 'El periodo esta cerrando con deficit. Conviene revisar los gastos principales y categorias de mayor peso.';
  }

  async function load() {
    loading = true;
    error = '';
    appliedKey = currentKey;

    const bounds = periodBounds(selectedMonth, Number($preferences.monthStart));
    const trendMonths = Array.from({ length: 6 }, (_, index) => addMonths(selectedMonth, index - 5));

    try {
      const [nextSummary, nextCategorySpend, nextBudgetUsage, nextTransactions, trendSummaries] =
        await Promise.all([
          api.summary(periodOptions),
          api.analytics.categorySpend(periodOptions),
          api.analytics.budgetUsage(periodOptions),
          api.transactions.list({ from: bounds.from, to: bounds.to }),
          Promise.all(
            trendMonths.map((month) =>
              api.summary({ month, startDay: Number($preferences.monthStart) })
            )
          )
        ]);

      summary = nextSummary;
      categorySpend = nextCategorySpend;
      budgetUsage = nextBudgetUsage;
      transactions = nextTransactions;
      trendPoints = trendSummaries.map((item) => ({
        label: trendLabel(item.month),
        income: item.income,
        expense: item.expense
      }));
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo cargar el reporte';
    } finally {
      loading = false;
    }
  }

  $: if (!loading && currentKey !== appliedKey) {
    load();
  }

  load();
</script>

<svelte:head>
  <title>Reportes | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="erp-header">
    <div class="min-w-0">
      <p class="eyebrow">Lectura ejecutiva</p>
      <h1 class="erp-title">Reportes</h1>
    </div>
    <div class="flex w-full flex-wrap items-end gap-3 md:w-auto">
      <label class="erp-field w-full min-w-0 sm:w-48">
        <span class="erp-label">Periodo</span>
        <MonthInput bind:value={selectedMonth} onChange={load} />
      </label>
      <StatusPill tone={summary && summary.balance >= 0 ? 'good' : 'warn'}>
        {summary ? formatPeriodMonth(summary.month) : 'Sin datos'}
      </StatusPill>
    </div>
  </header>

  {#if error}
    <p class="erp-error">{error}</p>
  {/if}

  {#if loading}
    <div class="erp-card erp-empty">Preparando reporte financiero...</div>
  {:else}
    <section class="erp-card overflow-hidden">
      <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="p-5 sm:p-6">
          <div class="flex items-center gap-3">
            <span class="grid size-11 place-items-center rounded-[8px] bg-forest-600/10 text-forest-600">
              <FileText size={21} strokeWidth={2.4} />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.10em] text-ink-500">Informe mensual</p>
              <h2 class="text-2xl font-black text-ink-950">{formatPeriodMonth(summary?.month)}</h2>
            </div>
          </div>
          <p class="mt-5 max-w-3xl text-base font-bold leading-7 text-ink-700">{mainInsight}</p>
        </div>
        <div class="border-t border-paper-200 bg-paper-100/70 p-5 lg:border-l lg:border-t-0">
          <p class="text-xs font-black uppercase tracking-[0.10em] text-ink-500">Ahorro del periodo</p>
          <strong class={['mt-3 block text-4xl font-black', savingsRate >= 0 ? 'text-emerald-700' : 'text-red-700']}>
            {savingsRate}%
          </strong>
          <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">
            Balance sobre ingresos registrados.
          </p>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="erp-card p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-black text-ink-500">Ingresos</p>
          <ArrowUpRight size={18} class="text-emerald-700" strokeWidth={2.5} />
        </div>
        <strong class="mt-3 block truncate text-2xl font-black text-ink-950 sm:text-3xl">{formatMoney(summary?.income ?? 0, $preferences.currency)}</strong>
      </article>
      <article class="erp-card p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-black text-ink-500">Gastos</p>
          <ArrowDownRight size={18} class="text-red-700" strokeWidth={2.5} />
        </div>
        <strong class="mt-3 block truncate text-2xl font-black text-ink-950 sm:text-3xl">{formatMoney(summary?.expense ?? 0, $preferences.currency)}</strong>
      </article>
      <article class="erp-card p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-black text-ink-500">Balance</p>
          <TrendingUp size={18} class={summary && summary.balance >= 0 ? 'text-emerald-700' : 'text-red-700'} strokeWidth={2.5} />
        </div>
        <strong class={['mt-3 block truncate text-2xl font-black sm:text-3xl', summary && summary.balance >= 0 ? 'text-ink-950' : 'text-red-700']}>
          {formatMoney(summary?.balance ?? 0, $preferences.currency)}
        </strong>
      </article>
      <article class="erp-card p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-black text-ink-500">Presupuesto</p>
          <Target size={18} class="text-forest-600" strokeWidth={2.5} />
        </div>
        <strong class="mt-3 block text-3xl font-black text-ink-950">{budgetPercent}%</strong>
        <p class="mt-1 text-xs font-bold text-ink-500">
          {formatMoney(summary?.expense ?? 0, $preferences.currency)} de {formatMoney(summary?.budget ?? 0, $preferences.currency)}
        </p>
      </article>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(24rem,0.85fr)]">
      <article class="erp-card">
        <div class="erp-card-header">
          <div>
            <h2 class="erp-card-title">Tendencia 6 meses</h2>
            <p class="mt-1 text-xs font-semibold text-ink-500">Ingresos versus gastos por periodo financiero.</p>
          </div>
          <CalendarRange size={18} class="text-ink-500" strokeWidth={2.4} />
        </div>
        {#if hasTrendData}
          <FlowChart points={trendPoints} currency={$preferences.currency} />
        {:else}
          <EmptyState
            icon={BarChart3}
            title="Sin tendencia disponible"
            description="Registra movimientos en varios meses para comparar comportamiento."
          />
        {/if}
      </article>

      <article class="erp-card">
        <div class="erp-card-header">
          <div>
            <h2 class="erp-card-title">Gasto por categoria</h2>
            <p class="mt-1 text-xs font-semibold text-ink-500">Peso relativo del periodo.</p>
          </div>
          <PieChart size={18} class="text-ink-500" strokeWidth={2.4} />
        </div>
        {#if hasCategoryData}
          <DonutChart
            items={categoryTotals}
            total={categoryTotals.reduce((sum, item) => sum + item.amount, 0)}
            currency={$preferences.currency}
          />
        {:else}
          <EmptyState
            icon={PieChart}
            title="Sin gasto categorizado"
            description="Clasifica movimientos para activar esta lectura."
            primaryHref="/categories"
            primaryLabel="Gestionar categorias"
          />
        {/if}
      </article>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <article class="erp-card">
        <div class="erp-card-header">
          <h2 class="erp-card-title">Hallazgos</h2>
        </div>
        <div class="grid gap-3 p-4">
          <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
            <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Categoria principal</p>
          <p class="mt-2 break-words text-lg font-black text-ink-950">
              {strongestCategory ? strongestCategory.name : 'Sin datos'}
            </p>
            <p class="mt-1 text-sm font-semibold text-ink-500">
              {strongestCategory
                ? `${formatMoney(strongestCategory.amount, $preferences.currency)} concentrados en esta categoria.`
                : 'Aun no hay gastos categorizados para analizar.'}
            </p>
          </div>
          <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
            <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Mayor ingreso</p>
          <p class="mt-2 break-words text-lg font-black text-ink-950">
              {topIncome ? formatMoney(topIncome.amount, $preferences.currency) : 'Sin ingresos'}
            </p>
            <p class="mt-1 text-sm font-semibold text-ink-500">
              {topIncome ? topIncome.description || 'Ingreso sin descripcion' : 'No hay ingresos en el periodo seleccionado.'}
            </p>
          </div>
          <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
            <p class="text-xs font-black uppercase tracking-[0.08em] text-ink-500">Presupuestos en alerta</p>
            <p class="mt-2 text-lg font-black text-ink-950">
              {(budgetUsage?.items ?? []).filter((item) => item.status !== 'ok').length}
            </p>
            <p class="mt-1 text-sm font-semibold text-ink-500">
              Categorias sobre 80% de uso o excedidas.
            </p>
          </div>
        </div>
      </article>

      <article class="erp-card">
        <div class="erp-card-header">
          <h2 class="erp-card-title">Gastos destacados</h2>
          <span class="rounded-full border border-paper-200 bg-paper-50 px-3 py-1 text-xs font-black text-ink-500">{topExpenses.length}</span>
        </div>
        {#if topExpenses.length === 0}
          <EmptyState
            icon={ReceiptText}
            title="Sin gastos en el periodo"
            description="Cuando registres gastos, aqui apareceran los de mayor impacto."
          />
        {:else}
          <div class="erp-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripcion</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {#each topExpenses as transaction}
                  <tr class="transition hover:bg-paper-100/70">
                    <td>{formatCalendarDate(transaction.date)}</td>
                    <td>
                      <a class="font-black text-ink-950 transition hover:text-forest-600" href={`/transactions/${transaction.id}`}>
                        {transaction.description || 'Sin descripcion'}
                      </a>
                    </td>
                    <td class="text-right text-red-700">{formatMoney(transaction.amount, $preferences.currency)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </article>
    </section>
  {/if}
</section>
