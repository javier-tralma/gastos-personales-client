<script lang="ts">
  import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { monthInputToValue, monthValueToInput } from '$lib/dates';

  export let value: number;
  export let onChange: (value: number) => void = () => {};

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  let open = false;
  let viewYear = Math.floor(value / 100);

  $: displayValue = formatDisplay(value);

  function formatDisplay(period: number) {
    const input = monthValueToInput(period);
    const [year, month] = input.split('-');
    const monthName = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date(Number(year), Number(month) - 1, 1));
    return `${monthName} de ${year}`;
  }

  function toggle() {
    viewYear = Math.floor(value / 100);
    open = !open;
  }

  function selectMonth(index: number) {
    value = monthInputToValue(`${viewYear}-${String(index + 1).padStart(2, '0')}`);
    onChange(value);
    open = false;
  }

  function selectCurrentMonth() {
    const now = new Date();
    value = now.getFullYear() * 100 + now.getMonth() + 1;
    onChange(value);
    open = false;
  }
</script>

<div class="relative">
  <button class="erp-input flex items-center justify-between gap-3 text-left capitalize" type="button" on:click={toggle}>
    <span>{displayValue}</span>
    <CalendarDays class="shrink-0 text-ink-500" size={17} strokeWidth={2.3} />
  </button>

  {#if open}
    <div class="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-[8px] border border-paper-200 bg-paper-50 p-3 shadow-[0_24px_70px_rgb(15_23_42/0.18)]">
      <div class="flex items-center justify-between gap-2">
        <button class="grid size-9 place-items-center rounded-[8px] text-ink-500 transition hover:bg-paper-100 hover:text-ink-950" type="button" on:click={() => (viewYear -= 1)} aria-label="Anio anterior">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>
        <p class="text-sm font-black text-ink-950">{viewYear}</p>
        <button class="grid size-9 place-items-center rounded-[8px] text-ink-500 transition hover:bg-paper-100 hover:text-ink-950" type="button" on:click={() => (viewYear += 1)} aria-label="Anio siguiente">
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div class="mt-3 grid grid-cols-4 gap-2">
        {#each months as month, index}
          <button
            class={[
              'min-h-10 rounded-[8px] text-sm font-black capitalize transition hover:bg-forest-600/10',
              value === viewYear * 100 + index + 1 ? 'bg-forest-600 text-white shadow-[0_10px_22px_rgb(0_119_182/0.25)] hover:bg-forest-600' : 'text-ink-700'
            ]}
            type="button"
            on:click={() => selectMonth(index)}
          >
            {month}
          </button>
        {/each}
      </div>

      <div class="mt-3 flex items-center justify-end border-t border-paper-200 pt-3">
        <button class="text-xs font-black text-forest-600 transition hover:text-ink-950" type="button" on:click={selectCurrentMonth}>Este mes</button>
      </div>
    </div>
  {/if}
</div>
