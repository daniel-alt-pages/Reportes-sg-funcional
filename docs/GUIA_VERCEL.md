# 🚀 Guía: Desplegar en Vercel — Portal de Puntajes SG

## Paso 1: Crear cuenta en Vercel

1. Ve a **<https://vercel.com>**
2. Click en **"Sign Up"** (arriba a la derecha)
3. Selecciona **"Continue with GitHub"**
4. Autoriza Vercel para acceder a tu cuenta de GitHub

---

## Paso 2: Importar el repositorio

1. Una vez dentro, click en **"Add New..." → "Project"**
   - O ve directo a: **<https://vercel.com/new>**
2. Verás una lista de tus repositorios de GitHub
3. Busca **"Reportes-sg-funcional"** y click en **"Import"**

---

## Paso 3: Configurar el proyecto

En la pantalla de configuración verás varios campos:

### 3.1 — Project Name

- Cambia el nombre a: **portal-de-puntajes-sg**
- (Esto define tu URL: portal-de-puntajes-sg.vercel.app)

### 3.2 — Framework Preset

- Debería decir **"Next.js"** automáticamente
- Si no, selecciónalo del dropdown

### 3.3 — Root Directory (⚠️ MUY IMPORTANTE)

- Click en **"Edit"** junto a "Root Directory"
- Escribe: **reportes-sg-next**
- Click en **"Continue"**
- Esto le dice a Vercel que tu app Next.js está dentro de esa carpeta

### 3.4 — Environment Variables

- Busca la sección que dice **"Environment Variables"**
- Ve a **Settings → Build and Deployment** o busca "Environment Variables"

Agrega las variables de tu archivo `.env.local`:

| Key (nombre)                                | Value (valor)                          |
|---------------------------------------------|----------------------------------------|
| NEXT_PUBLIC_FIREBASE_API_KEY                | (tu API key de Firebase)               |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN            | (tu auth domain)                       |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID             | (tu project ID)                        |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET         | (tu storage bucket)                    |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID    | (tu messaging sender ID)              |
| NEXT_PUBLIC_FIREBASE_APP_ID                 | (tu app ID)                            |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID         | (tu measurement ID)                    |

**💡 Tip**: Copia el contenido de tu `.env.local` y pégalo en el campo "Key".
Vercel es inteligente y separará automáticamente cada línea en Key=Value.

---

## Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera ~2 minutos mientras Vercel construye tu app
3. Si sale error, revisa los logs de build para ver qué pasó

---

## Paso 5: Autorizar dominio en Firebase

1. Ve a **<https://console.firebase.google.com>**
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Authentication**
4. Click en la pestaña **"Settings"** (Configuración)
5. Busca la sección **"Authorized domains"** (Dominios autorizados)
6. Click en **"Add domain"**
7. Escribe: **portal-de-puntajes-sg.vercel.app**
8. Click en **"Add"**

---

## ¡Listo! 🎉

Tu portal estará disponible en:
**<https://portal-de-puntajes-sg.vercel.app>**

Cada vez que hagas `git push` a GitHub, Vercel desplegará automáticamente.
