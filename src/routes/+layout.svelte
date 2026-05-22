<script lang="ts">
  import '../styles.css';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import ToastHost from '$lib/components/ToastHost.svelte';
  import { api, type AuthUser } from '$lib/rpc/client';
  import { preferences } from '$lib/stores/preferences';
  import {
    Bell,
    CreditCard,
    FileText,
    LayoutDashboard,
    Menu,
    Search,
    Settings,
    Tags,
    Target,
    X
  } from '@lucide/svelte';

  let navOpen = false;
  let user: AuthUser | null = null;
  let checkingAuth = true;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Movimientos', icon: CreditCard },
    { href: '/budgets', label: 'Presupuestos', icon: Target },
    { href: '/categories', label: 'Categorias', icon: Tags },
    { href: '/reports', label: 'Reportes', icon: FileText }
  ];

  const systemItems = [
    { href: '/settings', label: 'Configuracion', icon: Settings }
  ];

  $: activePath = $page.url.pathname;
  $: isAuthPage = activePath === '/login';
  $: pageTitle =
    navItems.find((item) => item.href === activePath)?.label ??
    systemItems.find((item) => item.href === activePath)?.label ??
    'Gastos Personales';

  afterNavigate(async () => {
    navOpen = false;
    if (!checkingAuth && !isAuthPage && !user) {
      user = await api.auth.me().catch(() => null);
      if (!user) await goto('/login');
      if (user) await preferences.loadRemote().catch(() => undefined);
    }
  });

  async function checkSession() {
    try {
      user = await api.auth.me().catch(() => null);

      if (!user && !isAuthPage) {
        await goto('/login');
      }

      if (user && isAuthPage) {
        await goto('/dashboard');
      }

      if (user) {
        await preferences.loadRemote().catch(() => undefined);
      }
    } catch {
      user = null;

      if (!isAuthPage) {
        await goto('/login');
      }
    } finally {
      checkingAuth = false;
    }
  }

  onMount(async () => {
    await checkSession();
  });

  async function logout() {
    await api.auth.logout();
    user = null;
    await goto('/login');
  }
</script>

<svelte:head>
  <meta
    name="description"
    content="ERP personal para administrar movimientos, categorias, presupuestos y resumen financiero."
  />
</svelte:head>

{#if checkingAuth}
  <div class="grid min-h-screen place-items-center bg-paper-100">
    <div class="rounded-[8px] border border-paper-200 bg-paper-50 px-5 py-4 text-sm font-black text-ink-950 shadow-lg shadow-slate-900/5">
      Preparando sesion...
    </div>
  </div>
{:else if isAuthPage}
  <slot />
{:else}
<div class={['min-h-screen bg-paper-100 lg:grid', $preferences.sidebarCollapsed ? 'lg:grid-cols-[5rem_minmax(0,1fr)]' : 'lg:grid-cols-[17rem_minmax(0,1fr)]']}>
  <aside
    class={[
      'fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2rem))] -translate-x-full flex-col overflow-y-auto border-r border-paper-200 bg-paper-50 px-3 py-4 text-ink-900 shadow-xl shadow-slate-900/5 transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-68 lg:translate-x-0 lg:shadow-none',
      $preferences.sidebarCollapsed && 'lg:w-20 lg:px-2',
      navOpen && 'translate-x-0'
    ]}
  >
    <a class={['flex items-center gap-3 rounded-[8px] px-3 py-2', $preferences.sidebarCollapsed && 'lg:justify-center lg:px-2']} href="/dashboard" title="Gastos Personales">
      <span class="grid size-10 place-items-center rounded-[8px] bg-forest-600 text-sm font-black text-white">
        GP
      </span>
      <span class={['min-w-0', $preferences.sidebarCollapsed && 'lg:hidden']}>
        <strong class="block truncate text-sm font-black tracking-wide text-ink-950">Gastos Personales</strong>
        <small class="block truncate text-xs font-bold text-ink-500">ERP financiero local</small>
      </span>
    </a>

    <div class={['mt-8 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-forest-600', $preferences.sidebarCollapsed && 'lg:px-0 lg:text-center']}>
      Principal
    </div>

    <nav class="mt-2 grid gap-1" aria-label="Principal">
      {#each navItems as item}
        <a
          class={[
            'group flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-bold text-ink-700 transition hover:bg-forest-600/10 hover:text-ink-950',
            $preferences.sidebarCollapsed && 'lg:justify-center lg:px-2',
            activePath === item.href && 'bg-forest-600/12 text-ink-950 shadow-[inset_3px_0_0_var(--forest-600)]'
          ]}
          href={item.href}
          title={item.label}
        >
          <item.icon
            class={activePath === item.href ? 'text-forest-600' : 'text-ink-500 group-hover:text-forest-600'}
            size={18}
            strokeWidth={2.1}
          />
          <span class={$preferences.sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class={['mt-8 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-forest-600', $preferences.sidebarCollapsed && 'lg:px-0 lg:text-center']}>
      Sistema
    </div>

    <div class="mt-2 grid gap-1">
      {#each systemItems as item}
        <a
          class={[
            'group flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-bold text-ink-700 transition hover:bg-forest-600/10 hover:text-ink-950',
            $preferences.sidebarCollapsed && 'lg:justify-center lg:px-2',
            activePath === item.href && 'bg-forest-600/12 text-ink-950 shadow-[inset_3px_0_0_var(--forest-600)]'
          ]}
          href={item.href}
          title={item.label}
        >
          <item.icon
            class={activePath === item.href ? 'text-forest-600' : 'text-ink-500 group-hover:text-forest-600'}
            size={18}
            strokeWidth={2.1}
          />
          <span class={$preferences.sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
        </a>
      {/each}
    </div>

    <div class={['mt-auto min-w-0 rounded-[8px] border border-forest-600/25 bg-forest-600/8 p-3', $preferences.sidebarCollapsed && 'lg:px-2 lg:text-center']}>
      <p class="text-[11px] font-black uppercase tracking-[0.12em] text-forest-600">Estado</p>
      <p class={['mt-1 truncate text-sm font-black text-ink-950', $preferences.sidebarCollapsed && 'lg:hidden']}>{user?.email ?? 'Sin sesion'}</p>
      <p class={['mt-1 hidden text-sm font-black text-ink-950', $preferences.sidebarCollapsed && 'lg:block']}>{user?.email?.slice(0, 2).toUpperCase() ?? 'GP'}</p>
      <button class={['mt-3 text-xs font-black text-forest-600 hover:text-ink-950', $preferences.sidebarCollapsed && 'lg:hidden']} type="button" on:click={logout}>
        Cerrar sesion
      </button>
    </div>
  </aside>

  {#if navOpen}
    <button
      aria-label="Cerrar navegacion"
      class="fixed inset-0 z-30 bg-brand-900/35 backdrop-blur-sm lg:hidden"
      type="button"
      on:click={() => (navOpen = false)}
    ></button>
  {/if}

  <main class="min-w-0">
    <header class="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-paper-200 bg-paper-100/92 px-3 backdrop-blur sm:h-18 sm:gap-4 sm:px-6 lg:px-7">
      <button class="erp-button-secondary !min-h-10 !px-3 lg:hidden" type="button" on:click={() => (navOpen = !navOpen)} aria-label="Abrir navegacion">
        {#if navOpen}
          <X size={18} strokeWidth={2.5} />
        {:else}
          <Menu size={18} strokeWidth={2.5} />
        {/if}
      </button>

      <div class="hidden items-center gap-3 lg:flex">
        <button
          class={[
            'grid size-10 place-items-center rounded-[8px] text-ink-700 transition hover:bg-paper-50 hover:text-ink-950',
            $preferences.sidebarCollapsed && 'bg-paper-50 text-ink-950 shadow-sm shadow-slate-900/5'
          ]}
          type="button"
          aria-label={$preferences.sidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          aria-pressed={$preferences.sidebarCollapsed}
          on:click={preferences.toggleSidebar}
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <span class="text-sm font-black text-ink-700">{pageTitle}</span>
      </div>

      <div class="ml-auto hidden h-11 w-full max-w-xs items-center gap-2 rounded-full border border-paper-200 bg-paper-50 px-4 shadow-sm shadow-slate-900/5 md:flex">
        <Search size={17} class="text-ink-500" strokeWidth={2.2} />
        <input class="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink-700 outline-none placeholder:text-ink-500/70" placeholder="Buscar" />
      </div>

      <button class="ml-auto grid size-10 place-items-center rounded-full text-ink-500 transition hover:bg-paper-50 hover:text-ink-950 md:ml-0" type="button" aria-label="Notificaciones">
        <Bell size={18} strokeWidth={2.2} />
      </button>
      <button class="grid size-10 place-items-center rounded-full bg-brand-900 text-sm font-black text-brand-contrast" type="button" on:click={logout} aria-label="Cerrar sesion">
        {user?.email?.slice(0, 2).toUpperCase() ?? 'GP'}
      </button>
    </header>

    <slot />
  </main>
</div>
{/if}

<ToastHost />
