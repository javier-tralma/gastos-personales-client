<script lang="ts">
  import { showToast } from '$lib/stores/toasts';
  import { preferences, type Preferences } from '$lib/stores/preferences';
  import { Bell, Database, Moon, PanelLeftClose, Palette, RotateCcw, ShieldCheck } from '@lucide/svelte';

  const settingsCards = [
    {
      title: 'Datos locales',
      body: 'La plataforma usa SQLite local con datos aislados por usuario autenticado.',
      icon: Database
    },
    {
      title: 'Seguridad',
      body: 'Las rutas protegidas usan sesion HTTP-only para evitar exponer credenciales al frontend.',
      icon: ShieldCheck
    },
    {
      title: 'Apariencia',
      body: 'Preferencias visuales persistentes para ajustar densidad y navegacion diaria.',
      icon: Palette
    }
  ];

  function updatePreference<Key extends keyof Preferences>(key: Key, value: Preferences[Key]) {
    preferences.setPreference(key, value);
    showToast('Preferencia actualizada', 'success');
  }

  function resetPreferences() {
    preferences.reset();
    showToast('Preferencias restablecidas', 'success');
  }
</script>

<svelte:head>
  <title>Configuracion | Gastos Personales</title>
</svelte:head>

<section class="erp-page">
  <header class="erp-header">
    <div class="min-w-0">
      <p class="eyebrow">Sistema</p>
      <h1 class="erp-title">Configuracion</h1>
    </div>
    <button class="erp-button-secondary w-full sm:w-auto" type="button" on:click={resetPreferences}>
      <RotateCcw size={16} strokeWidth={2.5} />
      Restablecer
    </button>
  </header>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
    <section class="erp-card">
      <div class="erp-card-header">
        <h2 class="erp-card-title">Preferencias generales</h2>
      </div>
      <div class="grid gap-4 p-3 sm:p-4 md:grid-cols-2">
        <label class="erp-field">
          <span class="erp-label">Moneda</span>
          <select
            class="erp-input"
            value={$preferences.currency}
            on:change={(event) => updatePreference('currency', event.currentTarget.value as Preferences['currency'])}
          >
            <option value="CLP">Peso chileno (CLP)</option>
            <option value="USD">Dolar estadounidense (USD)</option>
          </select>
        </label>

        <label class="erp-field">
          <span class="erp-label">Inicio de mes financiero</span>
          <select
            class="erp-input"
            value={$preferences.monthStart}
            on:change={(event) => updatePreference('monthStart', event.currentTarget.value as Preferences['monthStart'])}
          >
            <option value="1">Dia 1</option>
            <option value="15">Dia 15</option>
            <option value="25">Dia 25</option>
          </select>
        </label>

        <label class="erp-field">
          <span class="erp-label">Densidad de interfaz</span>
          <select
            class="erp-input"
            value={$preferences.density}
            on:change={(event) => updatePreference('density', event.currentTarget.value as Preferences['density'])}
          >
            <option value="comfortable">Comoda</option>
            <option value="compact">Compacta</option>
          </select>
        </label>

        <label class="erp-field">
          <span class="erp-label">Tema</span>
          <select
            class="erp-input"
            value={$preferences.theme}
            on:change={(event) => updatePreference('theme', event.currentTarget.value as Preferences['theme'])}
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="system">Sistema</option>
          </select>
        </label>

        <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-black text-ink-950">Alertas financieras</p>
              <p class="mt-1 text-sm font-semibold text-ink-500">Avisos cuando un presupuesto se acerque al limite.</p>
            </div>
            <button
              class={[
                'relative h-7 w-12 rounded-full transition',
                $preferences.notifications ? 'bg-forest-600' : 'bg-paper-200'
              ]}
              type="button"
              on:click={() => updatePreference('notifications', !$preferences.notifications)}
              aria-label="Alternar alertas financieras"
              aria-pressed={$preferences.notifications}
            >
              <span
                class={[
                  'absolute top-1 size-5 rounded-full bg-paper-50 transition shadow-sm shadow-slate-900/10',
                  $preferences.notifications ? 'left-6' : 'left-1'
                ]}
              ></span>
            </button>
          </div>
        </div>

        <div class="rounded-[8px] border border-paper-200 bg-paper-100/70 p-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-black text-ink-950">Sidebar compacto</p>
              <p class="mt-1 text-sm font-semibold text-ink-500">Reduce la navegacion a iconos en pantallas amplias.</p>
            </div>
            <button
              class={[
                'relative h-7 w-12 rounded-full transition',
                $preferences.sidebarCollapsed ? 'bg-forest-600' : 'bg-paper-200'
              ]}
              type="button"
              on:click={() => updatePreference('sidebarCollapsed', !$preferences.sidebarCollapsed)}
              aria-label="Alternar sidebar compacto"
              aria-pressed={$preferences.sidebarCollapsed}
            >
              <span
                class={[
                  'absolute top-1 size-5 rounded-full bg-paper-50 transition shadow-sm shadow-slate-900/10',
                  $preferences.sidebarCollapsed ? 'left-6' : 'left-1'
                ]}
              ></span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="erp-card">
      <div class="erp-card-header">
        <h2 class="erp-card-title">Proximas funciones utiles</h2>
      </div>
      <div class="grid gap-3 p-4">
        <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
          <div class="flex items-center gap-2 text-sm font-black text-ink-950">
            <Bell size={17} strokeWidth={2.3} />
            Reglas de alerta
          </div>
          <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">
            Avisar al 80%, 90% o 100% de consumo por categoria.
          </p>
        </div>
        <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
          <div class="flex items-center gap-2 text-sm font-black text-ink-950">
            <Moon size={17} strokeWidth={2.3} />
            Tema oscuro
          </div>
          <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">
            Los colores principales ya dependen de tokens semanticos light/dark.
          </p>
        </div>
        <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
          <div class="flex items-center gap-2 text-sm font-black text-ink-950">
            <PanelLeftClose size={17} strokeWidth={2.3} />
            Navegacion adaptable
          </div>
          <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">
            El boton superior alterna entre sidebar completo y compacto.
          </p>
        </div>
        <div class="rounded-[8px] border border-paper-200 bg-paper-50 p-3">
          <p class="text-sm font-black text-ink-950">Importacion bancaria</p>
          <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">
            Cargar CSV/Excel y clasificar movimientos automaticamente.
          </p>
        </div>
      </div>
    </section>
  </div>

  <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
    {#each settingsCards as item}
      <article class="erp-card p-4">
        <span class="grid size-10 place-items-center rounded-[8px] bg-forest-600/10 text-forest-600">
          <item.icon size={19} strokeWidth={2.4} />
        </span>
        <h2 class="mt-4 text-base font-black text-ink-950">{item.title}</h2>
        <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">{item.body}</p>
      </article>
    {/each}
  </section>
</section>
