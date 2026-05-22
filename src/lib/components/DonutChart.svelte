<script lang="ts">
  import { formatMoney, type CategorySpend } from '$lib/rpc/client';

  export let items: CategorySpend['categories'] = [];
  export let total = 0;
  export let currency: 'CLP' | 'USD' = 'CLP';

  $: segments = buildSegments(items);
  $: visibleSegments = segments.slice(0, 6);

  function buildSegments(categories: CategorySpend['categories']) {
    const sum = categories.reduce((acc, item) => acc + item.amount, 0);
    let cumulative = 0;

    if (sum === 0) return [];

    return categories.map((item) => {
      const percent = (item.amount / sum) * 100;
      const segment = {
        ...item,
        percent,
        color: item.color ?? '#0077B6',
        dash: `${percent} ${100 - percent}`,
        offset: -cumulative
      };
      cumulative += percent;
      return segment;
    });
  }
</script>

<div class="grid min-w-0 gap-5 p-4">
  <div class="relative mx-auto size-42 sm:size-48">
    <svg viewBox="0 0 42 42" class="size-full -rotate-90" role="img" aria-label="Distribucion mensual de gastos">
      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--paper-200)" stroke-width="7"></circle>
      {#each segments as segment}
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke={segment.color}
          stroke-width="7"
          stroke-dasharray={segment.dash}
          stroke-dashoffset={segment.offset}
        >
          <title>{segment.name}: {formatMoney(segment.amount, currency)}</title>
        </circle>
      {/each}
    </svg>
    <div class="absolute inset-0 grid place-items-center text-center">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.10em] text-ink-500">Total</p>
        <p class="mt-1 max-w-32 truncate text-lg font-black text-ink-950 sm:text-xl">{formatMoney(total, currency)}</p>
      </div>
    </div>
  </div>

  <div class="grid min-w-0 gap-3">
    {#each visibleSegments as category}
      <div class="grid min-w-0 gap-1">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm font-bold">
          <span class="inline-flex min-w-0 items-center gap-2 text-ink-700">
            <span class="size-3 shrink-0 rounded-full" style={`background: ${category.color}`}></span>
            <span class="truncate">{category.name}</span>
          </span>
          <span class="whitespace-nowrap text-ink-950">{formatMoney(category.amount, currency)}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-paper-100">
          <span class="block h-full rounded-full" style={`width: ${category.percent}%; background: ${category.color}`}></span>
        </div>
      </div>
    {/each}
  </div>
</div>
