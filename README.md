# FOMONOMO — Spontaneous Social

Mobile-first social activity discovery platform built with **Expo (React Native)**, **NestJS**, **Prisma**, **PostgreSQL (PostGIS)**, and **Redis**.

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20+ |
| pnpm | 10+ |
| Docker & Docker Compose | latest |
| Expo Go app | Install on your phone from the App Store / Play Store |

## Local setup

### 1. Clone & install

```bash
git clone https://github.com/sharuhasan/FOMONOMO-V1.git
cd FOMONOMO-V1
pnpm install
```

### 2. Start Postgres & Redis

```bash
cd apps/api
docker compose up -d
```

This starts:
- **PostgreSQL (PostGIS)** on host port `5433`
- **Redis** on host port `6380`

Wait a few seconds for the containers to become healthy:

```bash
docker compose ps   # both should show "healthy"
```

### 3. Configure the API

```bash
# Still inside apps/api
cp .env.example .env
```

Edit `apps/api/.env` and update the ports to match docker-compose:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/spontaneous_social?schema=public
REDIS_HOST=localhost
REDIS_PORT=6380

JWT_ACCESS_SECRET=<any-random-string>
JWT_REFRESH_SECRET=<another-random-string>
```

Leave the S3 and Anthropic keys blank for now — the app will work without them (uploads and AI suggestions will be disabled).

### 4. Run database migrations & seed

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed        # optional — populates sample data
```

### 5. Start the API

From the project root:

```bash
pnpm dev:api
```

The API will be available at `http://localhost:3000/api`.

### 6. Configure the mobile app

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

#### Running on an iOS Simulator / Android Emulator

No changes needed — the defaults work:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

#### Running on a physical device (same Wi-Fi)

Replace `localhost` with your computer's local IP (e.g. `192.168.x.x`):

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.x.x:3000
```

You can find your local IP with:

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

#### Running on a physical device (remote / different network)

Use the included Cloudflare Tunnel script:

```bash
# Install cloudflared first: brew install cloudflared
./start-tunnel.sh
```

Copy the printed URL and update your mobile `.env`:

```env
EXPO_PUBLIC_API_URL=https://xxxx.trycloudflare.com/api
EXPO_PUBLIC_SOCKET_URL=https://xxxx.trycloudflare.com
```

### 7. Start the mobile app

From the project root:

```bash
pnpm dev:mobile
```

This runs `expo start` and displays a **QR code** in your terminal.

#### Open on a simulator / emulator

- **Press `i`** to open in an iOS Simulator
- **Press `a`** to open in an Android Emulator

#### Open on a physical device (QR code)

1. Make sure your phone and computer are on the **same Wi-Fi network**.
2. Install **Expo Go** on your phone ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)).
3. Scan the QR code shown in the terminal:
   - **iPhone** — Open the default **Camera** app, point it at the QR code, and tap the banner that appears to open in Expo Go.
   - **Android** — Open the **Expo Go** app and tap **"Scan QR code"**.
4. The app will build and load on your phone. Hot-reload is enabled — any code change will update automatically.

## Project structure

```
├── apps/
│   ├── api/          # NestJS backend
│   └── mobile/       # Expo (React Native) frontend
├── packages/
│   └── shared/       # Shared Zod schemas & constants
├── turbo.json        # Turborepo config
└── pnpm-workspace.yaml
```

## Useful commands

| Command | Description |
|---------|-------------|
| `pnpm dev:api` | Start API in watch mode |
| `pnpm dev:mobile` | Start Expo dev server |
| `pnpm build` | Build all packages |
| `pnpm lint` | Type-check all packages |
| `pnpm test` | Run tests |
