# 🍬 Shop With Mel — Sistema de Ventas

PWA full-stack para administrar productos, clientes y ventas de una dulcería.

## Stack

- **Frontend**: Vite + React 18 + PWA (vite-plugin-pwa) — instalable como app
- **Backend**: Node.js + Express + JWT
- **Base de datos**: MySQL hosteada en Aiven (con SSL)
- **Excel**: Cada venta confirmada se acumula en `data/ventas.xlsx` con exceljs
- **Concurrently**: Un solo `npm run dev` levanta API + cliente

## Estructura

```
shop-with-mel/
├── package.json           # raíz (concurrently)
├── .env.example           # plantilla de variables
├── server/                # Node + Express
│   ├── src/
│   │   ├── index.js       # arranque
│   │   ├── db.js          # pool MySQL con SSL
│   │   ├── excel.js       # escritura del .xlsx
│   │   ├── middleware/auth.js  # JWT
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── products.js
│   │       ├── clients.js
│   │       └── sales.js
│   └── data/              # ventas.xlsx se genera aquí
└── client/                # Vite + React (PWA)
    ├── vite.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icon-{192,512}.png  # añadir manualmente
    └── src/
        ├── main.jsx, App.jsx, api.js
        ├── styles/
        └── components/
```

## 🚀 Setup paso a paso

### 1. Crear la base de datos en Aiven

1. Crea un servicio MySQL en https://console.aiven.io
2. Descarga el certificado **CA** desde el panel y guárdalo en `./certs/aiven-ca.pem`
3. Corre el esquema (te lo entregaron en `schema.sql`):
   ```bash
   mysql -h <host> -P <port> -u avnadmin -p \
         --ssl-mode=VERIFY_CA --ssl-ca=./certs/aiven-ca.pem \
         defaultdb < schema.sql
   ```

### 2. Variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales de Aiven
```

Genera un `JWT_SECRET` largo:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Instalar dependencias

```bash
npm run install:all
```

(Equivalente a `npm install` en la raíz, `server/` y `client/`).

### 4. Arrancar en desarrollo

```bash
npm run dev
```

- API: http://localhost:4000
- Frontend: http://localhost:5173 (proxy `/api → :4000`)

Login por defecto (creado por el seed):
- **Correo**: mel@shopwithmel.com
- **Contraseña**: dulce123

## 📦 Build de producción

```bash
npm run build      # construye client/dist
npm start          # sirve API + frontend estático en :4000
```

## ☁️ Hosting recomendado

| Pieza | Servicio | Notas |
|-------|----------|-------|
| **Base de datos** | Aiven MySQL | Free tier suficiente para empezar |
| **Backend + Frontend** | Railway / Render / Fly.io | Apuntan a `npm start` |
| **Sólo frontend** (alternativa) | Netlify / Vercel | Si separas el backend en otro servicio |

### Despliegue en Railway (más simple)

1. Push del repo a GitHub
2. En railway.app → **New project** → **Deploy from GitHub repo**
3. Añade las variables del `.env` en la pestaña **Variables**
4. Sube el `aiven-ca.pem` (Railway permite "raw files" desde Variables)
5. Build command: `npm run install:all && npm run build`
6. Start command: `npm start`

## 🔐 Producción — checklist

- [ ] `JWT_SECRET` aleatorio y largo (mínimo 32 caracteres)
- [ ] Cambia la contraseña del usuario admin (bcrypt hash nuevo)
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_ORIGIN` apuntando al dominio real
- [ ] HTTPS habilitado (tu hosting suele dar SSL gratis)
- [ ] Iconos PWA reales en `client/public/icon-{192,512}.png`
- [ ] Backups automáticos de la BD (Aiven los hace por ti)

## API endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/products` | ✅ | Lista productos activos |
| POST | `/api/products` | ✅ | Crear producto |
| PUT | `/api/products/:id` | ✅ | Actualizar |
| DELETE | `/api/products/:id` | ✅ | Soft delete |
| GET | `/api/clients?q=` | ✅ | Lista (búsqueda predictiva) |
| POST | `/api/clients` | ✅ | Crear cliente |
| PUT | `/api/clients/:id` | ✅ | Actualizar |
| DELETE | `/api/clients/:id` | ✅ | Soft delete |
| GET | `/api/sales?from=&to=` | ✅ | Historial con filtro de fechas |
| POST | `/api/sales` | ✅ | Registrar venta (descuenta stock + escribe Excel) |

## Licencia

Privado — Shop With Mel © 2025
