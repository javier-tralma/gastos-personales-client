<script lang="ts">
  import type { Component } from 'svelte';

  export let icon: Component | null = null;
  export let title: string;
  export let description: string;
  export let primaryHref = '';
  export let primaryLabel = '';
  export let secondaryHref = '';
  export let secondaryLabel = '';
</script>

<div class="grid min-h-52 place-items-center p-5 text-center sm:min-h-64 sm:p-8">
  <div class="max-w-sm">
    {#if icon}
      <span class="mx-auto grid size-12 place-items-center rounded-[8px] bg-forest-600/10 text-forest-600 ring-1 ring-forest-600/20">
        <svelte:component this={icon} size={22} strokeWidth={2.4} />
      </span>
    {/if}
    <h3 class="mt-4 text-lg font-black text-ink-950">{title}</h3>
    <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">{description}</p>
    {#if primaryHref || secondaryHref}
      <div class="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-center">
        {#if secondaryHref}
          <a class="erp-button-secondary" href={secondaryHref}>{secondaryLabel}</a>
        {/if}
        {#if primaryHref}
          <a class="erp-button" href={primaryHref}>{primaryLabel}</a>
        {/if}
      </div>
    {/if}
  </div>
</div>
