<script lang="ts">
  import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { dateInputValue, todayInputValue } from '$lib/dates';

  export let value = '';
  export let placeholder = 'Seleccionar fecha';

  const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const monthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

  let open = false;
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  $: displayValue = value ? formatDisplay(value) : placeholder;
  $: days = buildDays(viewYear, viewMonth);

  function formatDisplay(date: string) {
    const [year, month, day] = dateInputValue(date).split('-');
    return `${day}/${month}/${year}`;
  }

  function syncViewFromValue() {
    const source = value || todayInputValue();
    const [year, month] = source.split('-').map(Number);
    viewYear = year;
    viewMonth = month - 1;
  }

  function toggle() {
    syncViewFromValue();
    open = !open;
  }

  function moveMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    viewYear = next.getFullYear();
    viewMonth = next.getMonth();
  }

  function selectDate(date: string) {
    value = date;
    open = false;
  }

  function clearDate() {
    value = '';
    open = false;
  }

  function selectToday() {
    selectDate(todayInputValue());
  }

  function buildDays(year: number, month: number) {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const iso = [
        day.getFullYear(),
        String(day.getMonth() + 1).padStart(2, '0'),
        String(day.getDate()).padStart(2, '0')
      ].join('-');

      return {
        iso,
        label: day.getDate(),
        currentMonth: day.getMonth() === month,
        selected: iso === value,
        today: iso === todayInputValue()
      };
    });
  }
</script>

<div class="relative">
  <button class="erp-input flex items-center justify-between gap-3 text-left" type="button" on:click={toggle}>
    <span class={value ? 'text-ink-900' : 'text-ink-500/70'}>{displayValue}</span>
    <CalendarDays class="shrink-0 text-ink-500" size={17} strokeWidth={2.3} />
  </button>

  {#if open}
    <div class="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-[8px] border border-paper-200 bg-paper-50 p-3 shadow-[0_24px_70px_rgb(15_23_42/0.18)]">
      <div class="flex items-center justify-between gap-2">
        <button class="grid size-9 place-items-center rounded-[8px] text-ink-500 transition hover:bg-paper-100 hover:text-ink-950" type="button" on:click={() => moveMonth(-1)} aria-label="Mes anterior">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>
        <p class="text-sm font-black capitalize text-ink-950">{monthFormatter.format(new Date(viewYear, viewMonth, 1))}</p>
        <button class="grid size-9 place-items-center rounded-[8px] text-ink-500 transition hover:bg-paper-100 hover:text-ink-950" type="button" on:click={() => moveMonth(1)} aria-label="Mes siguiente">
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div class="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-black text-ink-500">
        {#each weekdays as day}
          <span class="py-1">{day}</span>
        {/each}
      </div>

      <div class="mt-1 grid grid-cols-7 gap-1">
        {#each days as day}
          <button
            class={[
              'grid aspect-square w-full place-items-center rounded-[8px] text-sm font-bold transition',
              day.currentMonth ? 'text-ink-900 hover:bg-forest-600/10' : 'text-ink-500/45 hover:bg-paper-100',
              day.today && !day.selected && 'ring-1 ring-forest-600/25',
              day.selected && 'bg-forest-600 text-white shadow-[0_10px_22px_rgb(0_119_182/0.25)] hover:bg-forest-600'
            ]}
            type="button"
            on:click={() => selectDate(day.iso)}
          >
            {day.label}
          </button>
        {/each}
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-paper-200 pt-3">
        <button class="text-xs font-black text-ink-500 transition hover:text-ink-950" type="button" on:click={clearDate}>Borrar</button>
        <button class="text-xs font-black text-forest-600 transition hover:text-ink-950" type="button" on:click={selectToday}>Hoy</button>
      </div>
    </div>
  {/if}
</div>
