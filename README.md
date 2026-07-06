# NENEZ Web — Plataforma de Venta de Entradas y Accesos

NENEZ Web es una aplicación web moderna, de alta gama y lista para producción, diseñada para la venta de entradas, gestión de accesos VIP y validación segura de tickets en eventos masivos. Construida con tecnologías de última generación, ofrece una interfaz de usuario inmersiva con animaciones de nivel cinematográfico y una arquitectura en la nube robusta y escalable.

---

## Características Principales

*   **Venta y Pasarela de Pagos Segura:** Integración nativa con **Kushki** para procesamiento seguro de tarjetas de crédito y débito.
*   **Generador y Envío Automático de Tickets:** Creación de entradas en tiempo real con diseño personalizado, número de serie único y código QR dinámico. Envío automático de archivos PDF y QR adjuntos directamente por **Gmail** (Google OAuth2 API).
*   **Panel de Administración VIP:** Panel privado para administradores que permite generar pases VIP manuales individuales o múltiples (hasta 50 en un solo clic) y despacharlos al instante por correo.
*   **Control y Validación de Accesos (Staff Scanner):** Interfaz optimizada para teléfonos móviles del personal del evento. Permite escanear códigos QR en tiempo real para validación instantánea (primer escaneo: acceso permitido; escaneos posteriores: acceso denegado).
*   **Experiencia Visual Inmersiva (Monochrome High-End):** Estética de diseño moderna con animaciones y transiciones de alto impacto visual utilizando **Framer Motion** y **GSAP (GreenSock)**.

---

## Arquitectura y Patrones de Diseño

El proyecto sigue una estructura limpia, desacoplada y orientada a la mantenibilidad y escalabilidad en producción:

### 1. Despliegue en AWS Ready (Persistencia Híbrida)
*   **PostgreSQL Nativo:** Diseñado para conectarse directamente a servicios en la nube de alta disponibilidad como **AWS RDS** o **Aurora Serverless v2**.
*   **Fallback Local Dinámico (Cero Fricción en Desarrollo):** La aplicación implementa el patrón de adaptador para la persistencia. Si no se detecta una base de datos PostgreSQL activa (`DATABASE_URL`), el sistema redirige automáticamente el almacenamiento a archivos locales JSON estructurados en la carpeta `/data/`. Esto permite probar todo el flujo localmente sin necesidad de configurar una base de datos.

### 2. Seguridad y Privacidad de Datos (PII Protection)
*   **Cifrado Determinista y No Determinista:** Los datos sensibles del cliente (teléfono, correo, documentos) se cifran antes de guardarse en la base de datos utilizando AES-256. 
*   **Validación QR Anti-Falsificación:** Los códigos QR generados contienen un token criptográfico único y firmado que evita la clonación o alteración de entradas.
*   **Protección Anti-Bots (Cloudflare Turnstile):** Protección transparente contra ataques de fuerza bruta en los accesos de administración mediante el uso inteligente del widget Turnstile de Cloudflare (omitido en desarrollo para facilitar pruebas rápidas).

---

## Stack Tecnológico

*   **Core:** Next.js 16 (App Router) + React 19 (TypeScript)
*   **Estilos y Transiciones:** TailwindCSS, Framer Motion y GSAP
*   **Base de Datos:** PostgreSQL (AWS / Aurora ready) + Adaptador Local JSON
*   **Procesador de Pagos:** Kushki API (Sandbox / Producción)
*   **Entrega de Correos:** Gmail API (Nodemailer / OAuth2)
*   **Seguridad:** Cloudflare Turnstile, bcryptjs y Web Crypto API

---

## Configuración y Ejecución Local

### 1. Requisitos Previos
Tener instalado Node.js (versión 20 o superior).

### 2. Instalación y Servidor de Desarrollo
1. Copia el archivo `.env.example` en la raíz del proyecto y renombralo a `.env.local` (este archivo contiene configuraciones locales y credenciales).
2. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del Proyecto

*   `/app`: Rutas dinámicas de la aplicación, vistas del administrador, staff y la API de Next.js.
*   `/frontend`: Componentes de UI reutilizables, hooks de control de estado, animaciones y vistas.
*   `/lib`: Módulos de lógica central del negocio:
    *   `/db`: Conexiones a PostgreSQL (`postgres.ts`) y adaptadores de datos (`passStore.ts`).
    *   `/tickets`: Lógica de recuperación de tokens y generación de imágenes/PDF de entradas.
*   `/database`: Archivos SQL con el esquema unificado (`schema.sql`) para inicializar las tablas en AWS.
*   `/data`: Carpeta de almacenamiento fallback para desarrollo local (archivos JSON).

---

## Despliegue a Producción (AWS / Vercel)

1. Crea tu base de datos PostgreSQL en AWS (RDS o Aurora Serverless v2).
2. Ejecuta el script unificado de inicialización [`database/schema.sql`](file:///c:/Users/Brandon/Downloads/nnz-web/database/schema.sql) para crear las tablas, índices parciales y estructuras de datos necesarias.
3. Configura las siguientes variables de entorno principales en tu servidor de producción:
    *   `DATABASE_URL`: Cadena de conexión a tu base de datos de AWS PostgreSQL.
    *   `JWT_SECRET` / `DATA_ENCRYPTION_KEY`: Claves criptográficas seguras de 32 bytes para sesión y cifrado.
    *   `KUSHKI_ENV`, `KUSHKI_PRIVATE_KEY`, `KUSHKI_MERCHANT_ID`: Credenciales oficiales provistas por Kushki.
    *   `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`: Tokens OAuth2 de Google para el envío de correos.
    *   `NEXT_PUBLIC_TURNSTILE_SITE_KEY_VISIBLE`, `TURNSTILE_SECRET_KEY_VISIBLE`: Claves de verificación de Cloudflare.
