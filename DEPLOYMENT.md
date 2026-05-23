# Deploy en Vercel

## Proyecto

- Framework preset: SvelteKit o Other
- Build command: `npm run build`
- Output directory: `build`
- Install command: `npm ci`

## Variables

Configura la URL publica del backend Render:

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Despues de que Render entregue la URL definitiva, vuelve a desplegar Vercel si cambias esta variable.

## Validacion

1. Abre la URL de Vercel.
2. Confirma que `/login` carga.
3. Crea una cuenta o inicia sesion.
4. Verifica que el dashboard cargue sin errores de CORS ni `Failed to fetch`.
