<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/rpc/client';

  let mode: 'login' | 'register' = 'login';
  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function submit() {
    loading = true;
    error = '';

    try {
      if (mode === 'login') {
        await api.auth.login({ email, password });
      } else {
        await api.auth.register({ email, password });
      }

      window.location.href = '/dashboard';
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo iniciar sesion';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{mode === 'login' ? 'Ingresar' : 'Crear cuenta'} | Gastos Personales</title>
</svelte:head>

<main class="grid min-h-screen grid-cols-1 bg-paper-100 lg:grid-cols-[minmax(0,1fr)_34rem]">
  <section class="hidden min-h-screen bg-brand-900 p-10 text-brand-contrast lg:grid">
    <div class="max-w-2xl self-center">
      <span class="grid size-14 place-items-center rounded-[8px] bg-forest-600 text-lg font-black text-white">GP</span>
      <p class="mt-10 text-sm font-black uppercase tracking-[0.16em] text-indigo-soft">ERP financiero personal</p>
      <h1 class="mt-4 max-w-xl text-5xl font-black leading-[0.95] tracking-normal">
        Controla gastos, presupuestos y decisiones sin perder contexto.
      </h1>
      <p class="mt-6 max-w-lg text-base font-semibold leading-7 text-paper-100/75">
        Plataforma local con sesiones propias, SQLite y una experiencia pensada para uso diario.
      </p>
    </div>
  </section>

  <section class="grid place-items-center px-3 py-6 sm:px-5 sm:py-10">
    <form class="w-full max-w-md rounded-[8px] border border-paper-200 bg-paper-50 p-4 shadow-[0_24px_80px_rgb(15_23_42/0.10)] sm:p-6" on:submit|preventDefault={submit}>
      <div>
        <p class="eyebrow">{mode === 'login' ? 'Bienvenido de vuelta' : 'Nuevo workspace'}</p>
        <h1 class="mt-2 text-2xl font-black text-ink-950 sm:text-3xl">{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h1>
        <p class="mt-2 text-sm font-semibold leading-6 text-ink-500">
          {mode === 'login'
            ? 'Ingresa con tu correo y password para acceder al dashboard.'
            : 'Crea tu primera cuenta para comenzar a registrar datos reales.'}
        </p>
      </div>

      {#if error}
        <p class="erp-error mt-5">{error}</p>
      {/if}

      <div class="mt-6 grid gap-4">
        <label class="erp-field">
          <span class="erp-label">Correo</span>
          <input class="erp-input" bind:value={email} autocomplete="email" type="email" placeholder="tu@email.com" />
        </label>

        <label class="erp-field">
          <span class="erp-label">Password</span>
          <input class="erp-input" bind:value={password} autocomplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" placeholder="Minimo 8 caracteres" />
        </label>
      </div>

      <button class="erp-button mt-6 w-full" disabled={loading} type="submit">
        {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
      </button>

      <button
        class="mt-4 w-full text-center text-sm font-black text-forest-600 hover:text-ink-950"
        type="button"
        on:click={() => {
          mode = mode === 'login' ? 'register' : 'login';
          error = '';
        }}
      >
        {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
      </button>
    </form>
  </section>
</main>
