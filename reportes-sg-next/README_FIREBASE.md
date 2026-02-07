# Despliegue en Firebase Hosting

¡Tu proyecto está listo para ser desplegado en Firebase!
La arquitectura ha sido adaptada para funcionar al 100% como un sitio estático de alto rendimiento.

## Pasos para Desplegar

1. **Instalar herramientas de Firebase** (solo la primera vez):
   Abre una terminal y ejecuta:
   ```bash
   npm install -g firebase-tools
   ```

2. **Iniciar Sesión**:
   ```bash
   firebase login
   ```
   (Sigue las instrucciones en el navegador para autenticarte con tu cuenta de Google)

3. **Inicializar Proyecto** (Si te lo pide, aunque ya configuré firebase.json):
   Si al desplegar te pide inicializar, usa:
   ```bash
   firebase init hosting
   ```
   - Selecciona "Use an existing project" -> `credenciales-sg`
   - Public directory: `out`
   - Configure as a single-page app? `Yes`
   - Set up automatic builds and deploys with GitHub? `No`

4. **Desplegar**:
   Para subir la web a internet, solo corre:
   ```bash
   npm run build
   firebase deploy
   ```

## Actualizar Datos

Cuando tengas nuevos simulacros:
1. Corre `python App.py` en tu PC para procesar los Excel.
2. Corre `python sincronizar_web.py` para copiar los JSON a la web.
3. Ejecuta `npm run build` y `firebase deploy`.

¡Listo! Tu web volará.
