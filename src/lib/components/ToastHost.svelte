<script lang="ts">
  import { toasts } from '$lib/stores/toasts';
</script>

<div class="fixed inset-x-3 bottom-3 z-50 grid gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[min(24rem,calc(100vw-2rem))]">
  {#each $toasts as toast}
    <div
      class={[
        'rounded-[8px] border px-4 py-3 text-sm font-bold shadow-[0_18px_55px_rgb(15_23_42/0.18)]',
        toast.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
        toast.tone === 'error' && 'border-red-200 bg-red-50 text-red-900',
        toast.tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-900'
      ]}
    >
      {toast.message}
    </div>
  {/each}
</div>
