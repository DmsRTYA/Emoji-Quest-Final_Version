# EmojiQuest

Game tebakan emoji multiplayer real-time.

Stack: Next.js 14, WebSocket, MySQL, Google OAuth, Web Audio API

---

## Cara Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Konfigurasi file `.env.local`
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=emoji_quest

JWT_SECRET=string_acak_panjang_minimal_32_karakter

# Google OAuth (opsional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Setup database
```bash
npm run db:setup
```

### 4. Jalankan server development

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - WebSocket (mode PVP):**
```bash
npm run dev:ws
```

**atau sekaligus:**
```bash
npm run dev:all
```

Buka http://localhost:3000

---

## Setup Google OAuth

1. Buka https://console.cloud.google.com
2. Buat project baru
3. Ke menu APIs & Services > Credentials > OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized JavaScript origins:
   ```
   http://localhost
   http://localhost:3000
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
7. Copy Client ID ke `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
8. Copy Client Secret ke `GOOGLE_CLIENT_SECRET`
9. Restart server

---

## Struktur Folder

```
eq-final/
├── app/                    # Next.js app router
│   ├── api/
│   │   ├── auth/          # Register, login, Google OAuth
│   │   ├── game/          # Question API, save score
│   │   └── leaderboard/   # Ranking global
│   └── page.tsx           # Root page
├── components/            # React components
│   ├── Avatar.tsx         # Avatar (foto/inisial/warna)
│   ├── AuthModal.tsx      # Modal login/register
│   ├── GameDashboard.tsx # Dashboard utama
│   ├── GameScreen.tsx     # Mode Santai & Ranked
│   ├── PVPLobby.tsx       # Mode PVP WebSocket
│   ├── Leaderboard.tsx    # Papan peringkat
│   ├── ProfileCard.tsx    # Profil user
│   └── LoadingStates.tsx  # Loading animations
├── hooks/
│   └── useGameAudio.ts    # Audio system
├── lib/
│   ├── db.ts              # Koneksi MySQL
│   ├── db-setup.js        # Setup database
│   ├── auth.ts            # JWT utilities
│   └── questions.ts       # Kumpulan soal emoji
└── server/
    └── ws-server.js       # WebSocket server (port 3001)
```

---

## Mode Permainan

| Mode | Jumlah Soal | Waktu per Soal | Sistem Poin |
|------|-------------|----------------|-------------|
| Santai | 10 | 30 detik | Skor personal |
| Ranked | 10 | 20 detik | LP naik dari 0, tidak pernah turun |
| PVP | 8 | 15 detik | 1v1 real-time |

---

## Tier Peringkat

| Tier | Minimal LP | Warna |
|------|-----------|-------|
| Bronze | 0 | #CD7F32 |
| Silver | 500 | #C0C0C0 |
| Gold | 1,200 | #FFD700 |
| Platinum | 2,200 | #E5E4E2 |
| Diamond | 3,500 | #B9F2FF |
| Master | 5,000 | #FFD60A |

---

## Sistem Audio

Semua efek suara dihasilkan secara real-time menggunakan Web Audio API, tidak perlu file audio eksternal.

---

## Fitur Foto Profil

Di halaman Profile > Change Photo:
- Take a photo - Gunakan kamera untuk capture langsung
- Choose from gallery - Pilih dari file di perangkat

Foto dari Google OAuth akan otomatis digunakan sebagai avatar. Jika tidak ada foto, ditampilkan inisial 2 huruf dengan warna otomatis.

---

## Deployment ke Production

```bash
# Build dan jalankan
npm run build && npm run start

# WebSocket server (gunakan PM2)
pm2 start server/ws-server.js --name eq-ws

# Update .env untuk production:
NEXT_PUBLIC_APP_URL=https://domain-anda.com
NEXT_PUBLIC_WS_URL=wss://domain-anda.com/ws
```

Untuk Google OAuth production, tambahkan domain di Google Cloud Console sesuai dengan authorized origins dan redirect URIs yang baru.