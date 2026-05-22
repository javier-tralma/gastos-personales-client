<script lang="ts">
  export let label: string;
  export let value: string;
  export let meta = '';
  export let accent = '#2f6f68';
</script>

<section
  class="erp-card relative grid min-h-30 content-between overflow-hidden p-4"
  style={`--accent: ${accent}`}
>
  <span class="absolute inset-x-4 top-0 h-1 rounded-b-full bg-[var(--accent)]"></span>
  <div class="min-w-0 pt-2">
    <span class="text-xs font-black uppercase tracking-[0.10em] text-ink-500">{label}</span>
    <strong class="mt-3 block truncate text-3xl font-black leading-none tracking-normal text-ink-950">{value}</strong>
  </div>
  {#if meta}
    <small class="mt-4 block text-sm font-bold leading-5 text-ink-500">{meta}</small>
  {/if}
</section>
