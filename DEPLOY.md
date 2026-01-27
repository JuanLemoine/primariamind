# Guia de Despliegue - PrimariaMind

## Pre-requisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Proyecto en [Supabase](https://supabase.com) configurado
3. API Key de [OpenAI](https://platform.openai.com)
4. Repositorio en GitHub (recomendado)

## Pasos para Deploy en Vercel

### 1. Preparar el Repositorio

```bash
# Inicializar git si no existe
cd primariamind
git init
git add .
git commit -m "Initial commit - PrimariaMind MVP"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/primariamind.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Selecciona el directorio `primariamind` como root directory
4. Framework: Next.js (auto-detectado)

### 3. Configurar Variables de Entorno

En Vercel Dashboard > Project Settings > Environment Variables, agrega:

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase | `eyJhbGciOiJI...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase | `eyJhbGciOiJI...` |
| `OPENAI_API_KEY` | API Key de OpenAI | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | URL de tu app en Vercel | `https://tu-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la app | `PrimariaMind` |

**Importante**: Marca todas las variables para los entornos Production, Preview y Development.

### 4. Configurar Supabase para Produccion

#### 4.1 Actualizar URLs de Autenticacion

En Supabase Dashboard > Authentication > URL Configuration:

- **Site URL**: `https://tu-app.vercel.app`
- **Redirect URLs**:
  - `https://tu-app.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (para desarrollo)

#### 4.2 Verificar Politicas RLS

Asegurate de que las politicas RLS esten activas en todas las tablas.

### 5. Deploy

1. Haz push a tu rama `main`
2. Vercel automaticamente desplegara los cambios
3. Verifica en el dashboard de Vercel que el build sea exitoso

### 6. Verificacion Post-Deploy

- [ ] La pagina de inicio carga correctamente
- [ ] El registro/login funciona
- [ ] El consentimiento se guarda
- [ ] El chat funciona y responde
- [ ] La deteccion de crisis funciona
- [ ] El portal de terapeutas es accesible

## Monitoreo

### Logs en Vercel

Ve a Vercel Dashboard > tu proyecto > Logs para ver:
- Errores de build
- Errores de runtime
- Logs de funciones serverless

### Metricas Importantes

1. **Latencia de API**: Las funciones de chat no deben tardar mas de 10s
2. **Errores 500**: Monitorear errores del servidor
3. **Uso de OpenAI**: Revisar consumo en el dashboard de OpenAI

## Troubleshooting

### Error: "Invalid API Key"
- Verifica que `OPENAI_API_KEY` este configurada correctamente en Vercel
- Asegurate de que la API key tenga saldo disponible

### Error: "Supabase connection failed"
- Verifica las URLs y keys de Supabase
- Revisa que el proyecto de Supabase este activo (no pausado)

### El chat no responde
- Revisa los logs de Vercel Functions
- Verifica que el timeout de las funciones sea suficiente (30s configurado)

### Problemas de autenticacion
- Verifica las URLs de redirect en Supabase
- Limpia cookies del navegador

## Actualizaciones

Para actualizar la aplicacion:

```bash
git add .
git commit -m "descripcion del cambio"
git push origin main
```

Vercel desplegara automaticamente los cambios.

## Rollback

Si necesitas volver a una version anterior:

1. Ve a Vercel Dashboard > Deployments
2. Encuentra el deployment anterior que funcionaba
3. Click en los tres puntos > "Promote to Production"
