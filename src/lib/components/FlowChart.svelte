<script lang="ts">
  import { formatMoney } from '$lib/rpc/client';

  export type FlowPoint = {
    label: string;
    income: number;
    expense: number;
  };

  export let points: FlowPoint[] = [];
  export let currency: 'CLP' | 'USD' = 'CLP';

  const width = 680;
  const height = 250;
  const top = 20;
  const right = 18;
  const bottom = 42;
  const left = 54;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  $: maxAmount = Math.max(...points.flatMap((point) => [point.income, point.expense]), 1);
  $: ticks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    ratio,
    value: Math.round(maxAmount * ratio),
    y: top + plotHeight * (1 - ratio)
  }));
  $: groupWidth = points.length > 0 ? plotWidth / points.length : plotWidth;
  $: barWidth = Math.min(18, Math.max(8, groupWidth * 0.2));

  function barHeight(value: number) {
    return value > 0 ? Math.max(3, (value / maxAmount) * plotHeight) : 0;
  }
</script>

<div class="min-w-0 px-3 pb-4 pt-3 sm:px-5">
  <svg class="h-[16.5rem] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Flujo semanal de ingresos y gastos">
    <defs>
      <linearGradient id="income-gradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#0077B6" />
        <stop offset="100%" stop-color="#00B4D8" />
      </linearGradient>
      <linearGradient id="expense-gradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#475569" />
        <stop offset="100%" stop-color="#94A3B8" />
      </linearGradient>
    </defs>

    {#each ticks as tick}
      <line x1={left} x2={width - right} y1={tick.y} y2={tick.y} stroke="var(--paper-200)" stroke-width="1" />
      <text x={left - 10} y={tick.y + 4} text-anchor="end" class="fill-ink-500 text-[11px] font-bold">
        {formatMoney(tick.value, currency)}
      </text>
    {/each}

    {#each points as point, index}
      {@const baseX = left + index * groupWidth + groupWidth / 2}
      {@const incomeHeight = barHeight(point.income)}
      {@const expenseHeight = barHeight(point.expense)}
      <rect
        x={baseX - barWidth - 3}
        y={top + plotHeight - incomeHeight}
        width={barWidth}
        height={incomeHeight}
        rx="5"
        fill="url(#income-gradient)"
      >
        <title>{point.label}: ingresos {formatMoney(point.income, currency)}</title>
      </rect>
      <rect
        x={baseX + 3}
        y={top + plotHeight - expenseHeight}
        width={barWidth}
        height={expenseHeight}
        rx="5"
        fill="url(#expense-gradient)"
      >
        <title>{point.label}: gastos {formatMoney(point.expense, currency)}</title>
      </rect>
      <text x={baseX} y={height - 18} text-anchor="middle" class="fill-ink-500 text-[12px] font-black uppercase">
        {point.label}
      </text>
    {/each}
  </svg>

  <div class="mt-1 flex flex-wrap justify-center gap-5 text-xs font-black text-ink-500">
    <span class="inline-flex items-center gap-2"><span class="size-3 rounded-full bg-forest-600"></span>Ingresos</span>
    <span class="inline-flex items-center gap-2"><span class="size-3 rounded-full bg-ink-500"></span>Gastos</span>
  </div>
</div>
