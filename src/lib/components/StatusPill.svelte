<script lang="ts">
  export let tone: 'good' | 'warn' | 'neutral' = 'neutral';
</script>

<span
  class={[
    'inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-black uppercase tracking-[0.08em]',
    tone === 'good' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
    tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-800',
    tone === 'neutral' && 'border-paper-200 bg-paper-50 text-ink-700'
  ]}
>
  <slot />
</span>
