const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

const PORT = process.env.WS_PORT || 3001;
const SECRET = process.env.JWT_SECRET || "fallback-dev-secret";

const PARTY_QUESTIONS = [
  {
    id: 1,
    answer: "Es Pisang Ijo",
    category: "Makanan",
    hint: "Makanan manis khas Sulawesi yang dibungkus daun pisang",
  },
  {
    id: 2,
    answer: "Tukang Bakso",
    category: "Profesi",
    hint: "Penjual makanan keliling dengan gerobak, sering teriak-teriak",
  },
  {
    id: 3,
    answer: "Nasi Padang",
    category: "Makanan",
    hint: "Makanan khas Sumatera yang terkenal dengan rendangnya",
  },
  {
    id: 4,
    answer: "Bocil FF",
    category: "Viral",
    hint: "Anak kecil yang kecanduan game battle royale di hp",
  },
  {
    id: 5,
    answer: "Anak Senja",
    category: "Slang",
    hint: "Istilah untuk anak muda yang suka galau dan foto langit sore",
  },
  {
    id: 6,
    answer: "Mobile Legends",
    category: "Game",
    hint: "Game MOBA 5v5 yang populer di kalangan anak muda Indonesia",
  },
  {
    id: 7,
    answer: "Ojol",
    category: "Profesi",
    hint: "Tukang ojek yang bisa dipanggil lewat aplikasi",
  },
  {
    id: 8,
    answer: "Kucing Oyen",
    category: "Hewan",
    hint: "Kucing berbulu oranye yang sering jadi meme di internet",
  },
  {
    id: 9,
    answer: "Mie Ayam",
    category: "Makanan",
    hint: "Mie rebus dengan topping ayam cincang, biasanya pakai pangsit",
  },
  {
    id: 10,
    answer: "Warung Madura",
    category: "Tempat",
    hint: "Warung kecil yang jual kebutuhan pokok, buka sampai malam",
  },
  {
    id: 11,
    answer: "Bucin",
    category: "Slang",
    hint: "Istilah untuk orang yang terlalu patuh sama pasangan",
  },
  {
    id: 12,
    answer: "Emak Naik Motor",
    category: "Kehidupan",
    hint: "Pemandangan sehari-hari di jalan: ibu-ibu boncengan dengan anak di depan",
  },
  {
    id: 13,
    answer: "Masuk Angin",
    category: "Penyakit",
    hint: "Kondisi badan tidak enak, perut kembung, sering dikerok",
  },
  {
    id: 14,
    answer: "Wibu",
    category: "Slang",
    hint: "Orang yang terobsesi dengan budaya pop Jepang dan anime",
  },
  {
    id: 15,
    answer: "Sate Taichan",
    category: "Makanan",
    hint: "Sate ayam tanpa bumbu kacang, cuma pakai sambal dan jeruk nipis",
  },
  {
    id: 16,
    answer: "Tongkrongan",
    category: "Tempat",
    hint: "Tempat nongkrong favorit anak muda, biasanya di pinggir jalan",
  },
  {
    id: 17,
    answer: "Hujan Naik Motor",
    category: "Aktivitas",
    hint: "Aktivitas yang bikin basah kuyup dan nyesek kalau lupa bawa jas hujan",
  },
  {
    id: 18,
    answer: "Nonton Drakor",
    category: "Hobi",
    hint: "Kegiatan menonton serial drama dari Korea Selatan",
  },
  {
    id: 19,
    answer: "Tukang Galon",
    category: "Profesi",
    hint: "Profesi yang sering mondar-mandir bawa air minum isi ulang",
  },
  {
    id: 20,
    answer: "Warkop",
    category: "Tempat",
    hint: "Tempat nongkrong sambil minum kopi dan ngopi santai",
  },
  {
    id: 21,
    answer: "FYP TikTok",
    category: "Viral",
    hint: "Halaman pertama TikTok yang bikin kamu lupa waktu",
  },
  {
    id: 22,
    answer: "Mantan Balikan",
    category: "Drama",
    hint: "Drama lama yang kebangkit lagi, seperti sinetron tak berujung",
  },
  {
    id: 23,
    answer: "Anak Warnet",
    category: "Nostalgia",
    hint: "Anak yang sering main game di rental komputer, jaman dulu",
  },
  {
    id: 24,
    answer: "Main Rank",
    category: "Game",
    hint: "Aktivitas seru tapi bikin emosi naik turun di game online",
  },
  {
    id: 25,
    answer: "Seblak Pedas",
    category: "Makanan",
    hint: "Makanan khas Bandung yang pedasnya bikin nangis",
  },
  {
    id: 26,
    answer: "Jemur Baju",
    category: "Aktivitas",
    hint: "Kegiatan rumah yang sering keburu hujan turun",
  },
  {
    id: 27,
    answer: "Kondangan",
    category: "Acara",
    hint: "Acara resmi pakai baju rapi, biasanya ada amplop putih",
  },
  {
    id: 28,
    answer: "Dosen Pembimbing",
    category: "Kampus",
    hint: 'Orang yang sering bikin revisi dan bilang "lanjutkan"',
  },
  {
    id: 29,
    answer: "Revisi Skripsi",
    category: "Kampus",
    hint: "Momok bagi mahasiswa tingkat akhir, seakan tak pernah selesai",
  },
  {
    id: 30,
    answer: "Tanggal Tua",
    category: "Meme",
    hint: "Masa dimana dompet mulai menipis, uang jajan pas-pasan",
  },
  {
    id: 31,
    answer: "Pinjol",
    category: "Viral",
    hint: "Layanan pinjaman online yang sering bikin masalah baru",
  },
  {
    id: 32,
    answer: "Beli Gorengan",
    category: "Aktivitas",
    hint: "Kegiatan simple yang bikin seneng, apalagi pas hujan",
  },
  {
    id: 33,
    answer: "Tidur Siang",
    category: "Hobi",
    hint: "Aktivitas favorit banyak orang, sayangnya bikin ngantuk berkepanjangan",
  },
  {
    id: 34,
    answer: "Tukang Parkir",
    category: "Profesi",
    hint: "Profesi yang biasanya punya rompi dan karcis, sering ngatur kendaraan",
  },
  {
    id: 35,
    answer: "Buka Puasa",
    category: "Momen",
    hint: "Saat yang ditunggu-tunggu pas bulan puasa, apalagi kalau ada es buah",
  },
  {
    id: 36,
    answer: "Baju Lebaran",
    category: "Momen",
    hint: "Baju baru yang dipakai setahun sekali pas hari raya",
  },
  {
    id: 37,
    answer: "Sinyal Hilang",
    category: "Derita",
    hint: "Kejadian yang paling menyebalkan pas lagi asyik main hp",
  },
  {
    id: 38,
    answer: "Kunci Hilang",
    category: "Derita",
    hint: "Kejadian yang bikin panik dan telat berangkat",
  },
  {
    id: 39,
    answer: "Dompet Ketinggalan",
    category: "Derita",
    hint: "Kejadian yang bikin harimu langsung hancur dan gak karuan",
  },
  {
    id: 40,
    answer: "Pecel Lele",
    category: "Makanan",
    hint: "Ikan goreng favorit anak kos, murah meriah dan mengenyangkan",
  },
  {
    id: 41,
    answer: "Boba",
    category: "Minuman",
    hint: "Minuman kekinian dengan bola-bola kenyal di dalamnya",
  },
  {
    id: 42,
    answer: "Kopi Susu",
    category: "Minuman",
    hint: "Minuman andalan para pekerja dan anak kos biar melek",
  },
  {
    id: 43,
    answer: "Pawang Hujan",
    category: "Viral",
    hint: "Seseorang yang katanya bisa mengendalikan cuaca, viral di konser",
  },
  {
    id: 44,
    answer: "Tukang Paket",
    category: "Profesi",
    hint: "Profesi yang sering dihubungi kalau belanja online",
  },
  {
    id: 45,
    answer: "Macet Jakarta",
    category: "Tempat",
    hint: "Pemandangan sehari-hari yang paling bikin bete se-Indonesia",
  },
  {
    id: 46,
    answer: "Ban Bocor",
    category: "Derita",
    hint: "Masalah yang sering muncul di jalan, apalagi malam hari",
  },
  {
    id: 47,
    answer: "Lupa Password",
    category: "Derita",
    hint: "Musuh terbesar di era digital, bikin gigit jari dan frustasi",
  },
  {
    id: 48,
    answer: "Begadang",
    category: "Aktivitas",
    hint: "Aktivitas malam yang bikin besoknya nyesal seharian",
  },
  {
    id: 49,
    answer: "Gajian Lewat",
    category: "Kehidupan",
    hint: "Hari yang ditunggu tiba-tiba molor, dompet udah menjerit",
  },
  {
    id: 50,
    answer: "Sukabumi",
    category: "Kota",
    hint: "Kota di Jawa Barat yang terkenal dengan moci dan wisata alamnya",
  },
  {
    id: 51,
    answer: "Es Teh Manis",
    category: "Minuman",
    hint: "Minuman yang selalu dipesan pas makan di warteg atau restoran",
  },
  {
    id: 52,
    answer: "Nasi Goreng",
    category: "Makanan",
    hint: "Makanan sejuta umat yang bisa dimakan kapan aja",
  },
  {
    id: 53,
    answer: "Indomie",
    category: "Makanan",
    hint: "Mie instan favorit yang jadi penyelamat anak kos di akhir bulan",
  },
  {
    id: 54,
    answer: "Martabak",
    category: "Makanan",
    hint: "Makanan manis atau gurih yang tebal dan penuh topping",
  },
  {
    id: 55,
    answer: "Cimol",
    category: "Makanan",
    hint: "Jajanan khas Bandung berbentuk bulat-bulat, kenyal dan pedas",
  },
  {
    id: 56,
    answer: "Gopay",
    category: "Teknologi",
    hint: "Dompet digital yang biasa dipakai buat bayar ojek online",
  },
  {
    id: 57,
    answer: "Skincare",
    category: "Kecantikan",
    hint: "Produk perawatan kulit yang sekarang wajib punya anak muda",
  },
  {
    id: 58,
    answer: "K-pop",
    category: "Musik",
    hint: "Musik asal Korea yang bikin orang di seluruh dunia demam",
  },
  {
    id: 59,
    answer: "Drakor",
    category: "Film",
    hint: "Serial TV dari Korea yang bikin baper dan ketagihan",
  },
  {
    id: 60,
    answer: "Badminton",
    category: "Olahraga",
    hint: "Olahraga tepok bulu yang jadi kebanggaan Indonesia di kancah dunia",
  },
  {
    id: 61,
    answer: "Sinetron",
    category: "Film",
    hint: "Tayangan TV yang plotnya bikin geleng-geleng kepala tapi adiktif",
  },
  {
    id: 62,
    answer: "Tuyul",
    category: "Misteri",
    hint: "Makhluk halus botak yang katanya suka nyolong uang",
  },
  {
    id: 63,
    answer: "Koboi",
    category: "Game",
    hint: "Gaya main game yang asal tembak tanpa mikir strategi",
  },
  {
    id: 64,
    answer: "Lapar Mata",
    category: "Slang",
    hint: "Kondisi dimana mata lebih banyak ngelihat daripada mulut makan",
  },
  {
    id: 65,
    answer: "Cukurukuk",
    category: "Meme",
    hint: "Suara khas yang populer jadi meme di media sosial Indonesia",
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function getPartyQuestions(n = 5) {
  return shuffle(PARTY_QUESTIONS).slice(0, n);
}
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

let pool;
(async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "emoji_quest",
    });
  } catch (e) {
    console.log("[EQ] DB not available, running without persistence");
  }
})();

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Tidak terautentikasi"));
  try {
    const user = jwt.verify(token, SECRET);
    socket.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      avatar_color: user.avatar_color,
    };
    next();
  } catch {
    next(new Error("Token tidak valid"));
  }
});

const rooms = new Map();

function getRoomPayload(room, userId) {
  const players = [];
  room.players.forEach((p) => {
    players.push({
      id: p.user.id,
      username: p.user.username,
      avatar_url: p.user.avatar_url,
      avatar_color: p.user.avatar_color,
      team: p.team,
      role: p.role || null,
      ready: p.ready || false,
      connected: p.connected !== false,
    });
  });

  let activeQuestion = null;
  if (
    room.state !== "LOBBY" &&
    room.state !== "RESULT" &&
    room.questions[room.currentQ]
  ) {
    activeQuestion = {
      category: room.questions[room.currentQ].category,
      answer: room.questions[room.currentQ].answer,
    };
  }

  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    hostName: room.hostInfo?.username,
    hostInfo: room.hostInfo,
    isPrivate: room.isPrivate,
    hostPlayMode: room.hostPlayMode || "spectator",
    maxTeams: room.maxTeams,
    state: room.state,
    players,
    scores: room.scores,
    currentQ: room.currentQ,
    totalQ: room.questions.length,
    activeQuestion,
    clues: room.clues,
    activeSkills: room.activeSkills,
    maxPlayers: room.maxTeams * 2,
    playerCount: room.players.size,
    showRoleConfirm: room.showRoleConfirm || false,
    roleConfirmTimer: room.roleConfirmTimer || 0,
    chatHistory: room.chatHistory || [],
    noClueTeams: room._noClueTeams || [],
    timerValue: room._timerValue || 0,
    usedSkills: room._usedSkills || {},
    teamSkills: room.teamSkills || {},
    hintsRemaining: room._hintsRemaining || {},
    perusuhTeams: room._perusuhTeams || [],
  };
}

function broadcastRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = { type: "room_update", room: getRoomPayload(room) };
  io.to(roomId).emit("room_update", payload);
}

function startGameTimer(roomId, seconds, onEnd) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room._timer) clearTimeout(room._timer);
  if (room._timerTick) clearInterval(room._timerTick);
  room._timerValue = seconds;
  io.to(roomId).emit("timer_tick", { seconds });
  room._timerTick = setInterval(() => {
    if (!rooms.has(roomId)) { clearInterval(room._timerTick); return; }
    if (room._timerValue > 0) {
      room._timerValue--;
      io.to(roomId).emit("timer_tick", { seconds: room._timerValue });
    }
  }, 1000);
  room._timer = setTimeout(() => {
    if (room._timerTick) {
      clearInterval(room._timerTick);
      room._timerTick = null;
    }
    room._timer = null;
    if (onEnd) onEnd();
  }, seconds * 1000);
}
function clearGameTimer(room) {
  if (room._timer) {
    clearTimeout(room._timer);
    room._timer = null;
  }
  if (room._timerTick) {
    clearInterval(room._timerTick);
    room._timerTick = null;
  }
}

function cleanupRoom(room) {
  clearGameTimer(room);
  if (room._roleTimer) {
    clearInterval(room._roleTimer);
    room._roleTimer = null;
  }
}

function getPublicRoomList() {
  const list = [];
  rooms.forEach((r) => {
    if (!r.isPrivate) {
      list.push({
        id: r.id,
        name: r.name,
        hostName: r.hostInfo?.username,
        playerCount: r.players.size,
        maxPlayers: r.maxTeams * 2,
        isPrivate: false,
        state: r.state,
        hasOngoingGame: r.state !== "LOBBY" && r.state !== "RESULT",
      });
    }
  });
  return list;
}

function endCluePhase(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.state !== "CLUE") return;
  room._noClueTeams = [];
  for (let t = 1; t <= room.maxTeams; t++) {
    const hasClueGiver = Array.from(room.players.values()).some(
      (op) => op.team === t && op.role === "clue",
    );
    if (hasClueGiver && !room.clues[t]) room._noClueTeams.push(t);
  }
  room.state = "TRANSITION";
  broadcastRoom(roomId);
  startGameTimer(roomId, 3, () => startGuessPhase(roomId));
}

function startGuessPhase(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.state !== "TRANSITION") return;
  room.state = "GUESS";
  room._guessed = {};
  broadcastRoom(roomId);
  startGameTimer(roomId, 15, () => nextQuestion(roomId));
}

function nextQuestion(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  clearGameTimer(room);
  
  const q = room.questions[room.currentQ];
  
  for (let t = 1; t <= room.maxTeams; t++) {
    if (!room._guessed[t]) {
      let pts = 0;
      if (room.activeSkills && room.activeSkills[t] === "ultimate") {
        pts = -2500;
        room.scores[t] += pts;
      }
      // Broadcast timeout result to team
      room.players.forEach((pp) => {
        if (pp.team === t) {
          io.to(pp.socketId).emit("guess_result", {
            correct: false,
            points: pts,
            answer: q ? q.answer : "",
          });
        }
      });
    }
  }
  
  room.currentQ++;
  if (room.currentQ >= room.questions.length) {
    room.state = "RESULT";
    broadcastRoom(roomId);
    if (pool) {
      let maxS = -9999,
        winTeam = 1;
      for (let i = 1; i <= room.maxTeams; i++)
        if ((room.scores[i] || 0) > maxS) {
          maxS = room.scores[i];
          winTeam = i;
        }
      room.players.forEach((p) => {
        pool
          .execute("UPDATE users SET total_games=total_games+1 WHERE id=?", [
            p.user.id,
          ])
          .catch(() => {});
        if (p.team === winTeam)
          pool
            .execute("UPDATE users SET pvp_wins=pvp_wins+1 WHERE id=?", [
              p.user.id,
            ])
            .catch(() => {});
        else
          pool
            .execute("UPDATE users SET pvp_losses=pvp_losses+1 WHERE id=?", [
              p.user.id,
            ])
            .catch(() => {});
      });
    }
  } else {
    room.state = "CLUE";
    room.clues = {};
    room.activeSkills = {};
    room._guessed = {};
    room._noClueTeams = [];
    room._clueLocked = {};
    room._hintsForRound = {};
    room._perusuhTeams = [];
    broadcastRoom(roomId);
    startGameTimer(roomId, 60, () => endCluePhase(roomId));
  }
}

io.on("connection", (socket) => {
  socket.join("global_lobby");
  socket.emit("global_rooms", { rooms: getPublicRoomList() });

  socket.on("get_rooms", () => {
    socket.emit("global_rooms", { rooms: getPublicRoomList() });
  });

  socket.on("create_room", (data) => {
    const roomId = data.isPrivate ? generateRoomCode() : generateRoomId();
    const room = {
      id: roomId,
      name: data.name || "Room 1",
      hostId: socket.user.id,
      hostInfo: socket.user,
      isPrivate: !!data.isPrivate,
      hostPlayMode: data.hostPlayMode || "spectator", // "spectator" or "playing"
      maxTeams: Math.min(5, Math.max(2, data.maxTeams || 2)),
      players: new Map(),
      state: "LOBBY",
      questions: getPartyQuestions(5),
      currentQ: 0,
      clues: {},
      scores: {},
      activeSkills: {},
      _guessed: {},
      _timer: null,
      _timerTick: null,
      _timerValue: 0,
      showRoleConfirm: false,
      roleConfirmTimer: 0,
      chatHistory: [],
      _pendingSwap: null,
      _noClueTeams: [],
      _clueLocked: {},
      _usedSkills: {},
      _hintsRemaining: {},
      _hintsForRound: {},
      _roleSwapCooldowns: {},
    };
    for (let i = 1; i <= room.maxTeams; i++) room.scores[i] = 0;
    rooms.set(roomId, room);
    socket.leave("global_lobby");
    socket.join(roomId);
    
    // If host wants to play, join as regular player
    if (data.hostPlayMode === "playing") {
      // Check if room has space
      if (room.players.size < room.maxTeams * 2) {
        // Find first available team with space
        const counts = {};
        for (let i = 1; i <= room.maxTeams; i++) counts[i] = 0;
        room.players.forEach((p) => counts[p.team]++);
        
        let assignedTeam = 1;
        for (let i = 1; i <= room.maxTeams; i++) {
          if (counts[i] < 2) {
            assignedTeam = i;
            break;
          }
        }
        
        room.players.set(socket.user.id, {
          ws: socket,
          user: socket.user,
          team: assignedTeam,
          role: null,
          connected: true,
          ready: false,
          socketId: socket.id,
        });
      }
    }
    
    broadcastRoom(roomId);
    io.to("global_lobby").emit("global_rooms", { rooms: getPublicRoomList() });
  });

  socket.on("join_room", (data) => {
    const rId = (data.roomId || "").toUpperCase();
    const room = rooms.get(rId);
    if (!room)
      return socket.emit("error", { message: "Room tidak ditemukan." });
    if (room.players.has(socket.user.id)) {
      const existing = room.players.get(socket.user.id);
      if (existing && existing.connected === false) {
        existing.connected = true;
        existing.ws = socket;
        existing.socketId = socket.id;
        socket.leave("global_lobby");
        socket.join(rId);
        broadcastRoom(rId);
        io.to("global_lobby").emit("global_rooms", { rooms: getPublicRoomList() });
        return;
      }
      return socket.emit("error", { message: "Kamu sudah di room ini." });
    }
    if (room.players.size >= room.maxTeams * 2)
      return socket.emit("error", { message: "Room penuh." });
    if (room.state !== "LOBBY" && room.state !== "RESULT")
      return socket.emit("error", { message: "Game sedang berlangsung." });

    const counts = {};
    for (let i = 1; i <= room.maxTeams; i++) counts[i] = 0;
    room.players.forEach((p) => counts[p.team]++);
    let assignedTeam = 1;
    for (let i = 1; i <= room.maxTeams; i++) {
      if (counts[i] < 2) {
        assignedTeam = i;
        break;
      }
    }

    room.players.set(socket.user.id, {
      ws: socket,
      user: socket.user,
      team: assignedTeam,
      role: null,
      connected: true,
      ready: false,
      socketId: socket.id,
    });
    socket.leave("global_lobby");
    socket.join(rId);
    broadcastRoom(rId);
    io.to("global_lobby").emit("global_rooms", { rooms: getPublicRoomList() });
  });

  socket.on("change_team", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const p = room.players.get(socket.user.id);
    if (!p) return;
    let c = 0;
    room.players.forEach((op) => {
      if (op.team === data.team) c++;
    });
    if (c < 2) {
      p.team = data.team;
      broadcastRoom(room.id);
    }
  });

  socket.on("change_role", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const p = room.players.get(socket.user.id);
    if (!p) return;
    const teamPlayers = [];
    room.players.forEach((op) => {
      if (op.team === p.team) teamPlayers.push(op);
    });
    const roleTaken = teamPlayers.some(
      (op) => op.id !== socket.user.id && op.role === data.role,
    );
    if (!roleTaken) {
      p.role = data.role;
      room._pendingSwap = null;
      broadcastRoom(room.id);
    }
  });

  socket.on("reset_role", () => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const p = room.players.get(socket.user.id);
    if (!p) return;
    p.role = null;
    broadcastRoom(room.id);
  });

  socket.on("request_role_swap", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const requester = room.players.get(socket.user.id);
    if (!requester || !requester.role) return;
    const target = room.players.get(data.targetId);
    if (!target || !target.role || target.team !== requester.team) return;
    if (room._pendingSwap)
      return socket.emit("error", {
        message: "Masih ada permintaan tukar role yang pending.",
      });
    const now = Date.now();
    const nextAllowed = (room._roleSwapCooldowns && room._roleSwapCooldowns[requester.user.id]) || 0;
    if (nextAllowed > now) {
      const remainingSec = Math.ceil((nextAllowed - now) / 1000);
      return socket.emit("error", {
        message: `Tunggu ${remainingSec} detik sebelum kirim request lagi.`,
      });
    }
    if (!room._roleSwapCooldowns) room._roleSwapCooldowns = {};
    room._roleSwapCooldowns[requester.user.id] = now + 5000;
    room._pendingSwap = {
      requesterId: requester.user.id,
      targetId: target.user.id,
      requesterRole: requester.role,
      targetRole: target.role,
    };
    io.to(target.socketId).emit("role_swap_requested", {
      requesterId: requester.user.id,
      requesterName: requester.user.username,
      requesterRole: requester.role,
      targetRole: target.role,
    });
    io.to(requester.ws.id).emit("role_swap_pending", {
      message: "Menunggu persetujuan tukar role...",
    });
  });

  socket.on("respond_role_swap", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const target = room.players.get(socket.user.id);
    if (!target) return;
    if (!room._pendingSwap || room._pendingSwap.targetId !== target.user.id)
      return;
    const requester = room.players.get(room._pendingSwap.requesterId);
    if (!requester || requester.team !== target.team) {
      room._pendingSwap = null;
      return;
    }

    if (data.accept) {
      const tmp = requester.role;
      requester.role = target.role;
      target.role = tmp;
      io.to(requester.ws.id).emit("role_swap_result", {
        accepted: true,
        message: "Role berhasil ditukar.",
      });
      io.to(target.ws.id).emit("role_swap_result", {
        accepted: true,
        message: "Role berhasil ditukar.",
      });
      broadcastRoom(room.id);
    } else {
      io.to(requester.ws.id).emit("role_swap_result", {
        accepted: false,
        message: "Pengajuan tukar role ditolak.",
      });
    }
    room._pendingSwap = null;
  });

  socket.on("start_game", () => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.user.id || room.state !== "LOBBY")
      return;

    const teamPlayers = {};
    room.players.forEach((p) => {
      if (!teamPlayers[p.team]) teamPlayers[p.team] = [];
      teamPlayers[p.team].push(p);
    });

    const needRoleConfirm = [];
    Object.keys(teamPlayers).forEach((t) => {
      teamPlayers[t].forEach((p) => {
        if (!p.role || (p.role !== "clue" && p.role !== "guess"))
          needRoleConfirm.push(p);
      });
    });

    if (needRoleConfirm.length > 0) {
      room.showRoleConfirm = true;
      room.roleConfirmTimer = 10;
      room._roleConfirmPlayers = needRoleConfirm.map((p) => p.user.id);
      broadcastRoom(room.id);
      let sec = 9;
      room._roleTimer = setInterval(() => {
        room.roleConfirmTimer = sec;
        broadcastRoom(room.id);
        if (sec <= 0) {
          clearInterval(room._roleTimer);
          room.showRoleConfirm = false;
          const unready = Array.from(room.players.values()).filter(
            (p) => !p.role || (p.role !== "clue" && p.role !== "guess"),
          );
          room.players.forEach((p) => {
            if (p.user.id === room.hostId) {
              io.to(p.socketId).emit("role_timeout", {
                message: "Ada pemain yang belum memilih role.",
                unreadyPlayers: unready.map((u) => ({
                  id: u.user.id,
                  username: u.user.username,
                })),
              });
            }
          });
          broadcastRoom(room.id);
        }
        sec--;
      }, 1000);
      return;
    }

    actuallyStartGame(room);
  });

  socket.on("confirm_role", (data) => {
    const room = findRoom(socket);
    if (!room) return;
    const p = room.players.get(socket.user.id);
    if (!p) return;
    const teamPlayers = [];
    room.players.forEach((op) => {
      if (op.team === p.team) teamPlayers.push(op);
    });
    const roleTaken = teamPlayers.some(
      (op) => op.id !== socket.user.id && op.role === data.role,
    );
    if (!roleTaken) {
      p.role = data.role;
      broadcastRoom(room.id);
      const allReady = Array.from(room.players.values()).every(
        (pp) => pp.role === "clue" || pp.role === "guess",
      );
      if (allReady && room.showRoleConfirm) {
        clearInterval(room._roleTimer);
        room.showRoleConfirm = false;
        broadcastRoom(room.id);
        setTimeout(() => actuallyStartGame(room), 500);
      }
    }
  });

  socket.on("kick_player", (data) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.user.id || room.state !== "LOBBY")
      return;
    const target = room.players.get(data.playerId);
    if (!target) return;
    io.to(target.socketId).emit("kicked", {
      message: "Kamu telah dikeluarkan dari room oleh host.",
    });
    room.players.delete(data.playerId);
    broadcastRoom(room.id);
    io.to("global_lobby").emit("global_rooms", { rooms: getPublicRoomList() });
  });

  socket.on("host_handle_unready", (data) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.user.id || room.state !== "LOBBY")
      return;
    if (data.action === "kick" && Array.isArray(data.playerIds)) {
      data.playerIds.forEach((pid) => {
        const target = room.players.get(pid);
        if (target) {
          io.to(target.socketId).emit("kicked", {
            message:
              "Kamu telah dikeluarkan dari room oleh host karena belum memilih role.",
          });
          room.players.delete(pid);
        }
      });
      broadcastRoom(room.id);
      io.to("global_lobby").emit("global_rooms", {
        rooms: getPublicRoomList(),
      });
    }
    if (data.action === "wait") {
      room.showRoleConfirm = true;
      room.roleConfirmTimer = 10;
      broadcastRoom(room.id);
      let sec = 9;
      clearInterval(room._roleTimer);
      room._roleTimer = setInterval(() => {
        room.roleConfirmTimer = sec;
        broadcastRoom(room.id);
        if (sec <= 0) {
          clearInterval(room._roleTimer);
          room.showRoleConfirm = false;
          const unready = Array.from(room.players.values()).filter(
            (p) => !p.role || (p.role !== "clue" && p.role !== "guess"),
          );
          room.players.forEach((p) => {
            if (p.user.id === room.hostId) {
              io.to(p.socketId).emit("role_timeout", {
                message: "Masih ada pemain yang belum memilih role.",
                unreadyPlayers: unready.map((u) => ({
                  id: u.user.id,
                  username: u.user.username,
                })),
              });
            }
          });
          broadcastRoom(room.id);
        }
        sec--;
      }, 1000);
    }
  });

  socket.on("submit_clue", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "CLUE") return;
    const p = room.players.get(socket.user.id);
    if (!p || p.role !== "clue") return;
    if (room._clueLocked[p.team]) return;
    room._clueLocked[p.team] = true;
    room.clues[p.team] = data.emojis || "";
    socket.emit("clue_submitted"); // Acknowledge to sender
    broadcastRoom(room.id);
    let allSubmitted = true;
    for (let t = 1; t <= room.maxTeams; t++) {
      const hasClueGiver = Array.from(room.players.values()).some(
        (op) => op.team === t && op.role === "clue",
      );
      if (hasClueGiver && !room.clues[t]) {
        allSubmitted = false;
        break;
      }
    }
    if (allSubmitted) {
      clearGameTimer(room);
      endCluePhase(room.id);
    }
  });

  socket.on("submit_guess", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "GUESS") return;
    const p = room.players.get(socket.user.id);
    if (!p || p.role !== "guess") return;
    if (room._guessed[p.team]) return;

    const q = room.questions[room.currentQ];
    if (!q) return;
    const correct = q.answer.toLowerCase();
    const guess = (data.guess || "").toLowerCase().trim();
    const timeLeft = data.timeLeft || 0;
    const isUltimate = room.activeSkills[p.team] === "ultimate";
    const isDoublePoint = room.activeSkills[p.team] === "double_point";
    const isRiskGamble = room.activeSkills[p.team] === "risk_gamble";
    const isLuckyBonus = room.activeSkills[p.team] === "lucky_bonus";
    const isPointSteal = room.activeSkills[p.team] === "point_steal";

    const isCorrect =
      guess === correct ||
      correct.split(" ").some((w) => w.length > 3 && guess.includes(w));

    let pts = 0;
    if (isCorrect) {
      if (isUltimate) {
        pts = 5000;
      } else if (isRiskGamble) {
        pts = 2000;
      } else {
        if (timeLeft > 10) pts = 1000;
        else if (timeLeft > 5) pts = 750;
        else pts = 500;
        
        if (isLuckyBonus) {
          // Bonus random 200-1000
          pts += Math.floor(Math.random() * 9) * 100 + 200;
        }
      }
      
      if (isDoublePoint) pts *= 2;
      room.scores[p.team] += pts;

      if (isPointSteal) {
        let stolen = 0;
        for (let i = 1; i <= room.maxTeams; i++) {
          if (i !== p.team && room.teamSkills[i]) {
             const stealAmt = 250;
             room.scores[i] -= stealAmt;
             stolen += stealAmt;
          }
        }
        room.scores[p.team] += stolen;
      }
    } else {
      if (isUltimate) pts = -5000;
      else if (isRiskGamble) pts = -1000;
      else pts = -250;
      room.scores[p.team] += pts;
    }

    room._guessed[p.team] = true;
    
    // Broadcast result to everyone in the team so Clue Giver also sees the popup
    room.players.forEach((pp) => {
      if (pp.team === p.team) {
        io.to(pp.socketId).emit("guess_result", {
          correct: isCorrect,
          points: pts,
          answer: q.answer,
        });
      }
    });

    broadcastRoom(room.id);

    let allGuessed = true;
    for (let t = 1; t <= room.maxTeams; t++) {
      const hasGuesser = Array.from(room.players.values()).some(
        (op) => op.team === t && op.role === "guess",
      );
      if (hasGuesser && !room._guessed[t]) {
        allGuessed = false;
        break;
      }
    }
    if (allGuessed) {
      clearGameTimer(room);
      nextQuestion(room.id);
    }
  });

  socket.on("use_skill", (data) => {
    const room = findRoom(socket);
    if (!room || room.state === "LOBBY" || room.state === "RESULT") return;
    const p = room.players.get(socket.user.id);
    if (!p || p.role !== "guess") return;
    if (room.activeSkills[p.team]) return;
    if (room._usedSkills[p.team]?.[data.skillId]) return;
    const usedCount = Object.keys(room._usedSkills[p.team] || {}).length;
    if (usedCount >= 3) return socket.emit("error", { message: "Batas maksimal 3 skill sudah tercapai." });
    if (!room.teamSkills?.[p.team]?.includes(data.skillId)) return socket.emit("error", { message: "Skill tidak valid." });
    if (!room._usedSkills[p.team]) room._usedSkills[p.team] = {};
    room._usedSkills[p.team][data.skillId] = true;
    room.activeSkills[p.team] = data.skillId;
    if (["emoji_chaos", "blur_vision", "fake_shake"].includes(data.skillId)) {
      if (!room._perusuhTeams) room._perusuhTeams = [];
      room._perusuhTeams.push(p.team);
    }
    if (data.skillId === "extra_time") {
      room._timerValue += 10;
    }
    io.to(room.id).emit("skill_used", { team: p.team, skillId: data.skillId, playerName: socket.user.username });
    broadcastRoom(room.id);
  });

  socket.on("request_hint", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "GUESS") return;
    const p = room.players.get(socket.user.id);
    if (!p || p.role !== "guess") return;
    if (!room._hintsRemaining[p.team]) room._hintsRemaining[p.team] = 2;
    if (room._hintsRemaining[p.team] <= 0) return;
    const q = room.questions[room.currentQ];
    if (!q || !q.hint) return;
    room._hintsRemaining[p.team]--;
    room._hintsForRound[p.team] = true;
    room.players.forEach((pp) => {
      if (pp.team === p.team) {
        io.to(pp.socketId).emit("hint_revealed", {
          hint: q.hint,
          team: p.team,
        });
      }
    });
    broadcastRoom(room.id);
  });

  socket.on("play_again", () => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.user.id) return;
    clearGameTimer(room);
    room.state = "LOBBY";
    room.currentQ = 0;
    for (let i = 1; i <= room.maxTeams; i++) room.scores[i] = 0;
    room.clues = {};
    room.activeSkills = {};
    room._guessed = {};
    room._noClueTeams = [];
    room._clueLocked = {};
    room._usedSkills = {};
    const ALL_SKILLS = ['double_point', 'extra_time', 'shield', 'emoji_chaos', 'blur_vision', 'fake_shake', 'lucky_bonus', 'risk_gamble', 'point_steal'];
    room.teamSkills = {};
    for(let i=1; i<=room.maxTeams; i++) {
      const skills = [];
      const pool = [...ALL_SKILLS];
      if (Math.random() < 0.05) skills.push('ultimate');
      while(skills.length < 3) {
        const idx = Math.floor(Math.random() * pool.length);
        skills.push(pool[idx]);
        pool.splice(idx, 1);
      }
      room.teamSkills[i] = skills;
    }
    room._hintsRemaining = {};
    room._hintsForRound = {};
    room._perusuhTeams = [];
    room.questions = getPartyQuestions(5);
    room.players.forEach((p) => {
      p.ready = false;
    });
    broadcastRoom(room.id);
    io.to("global_lobby").emit("global_rooms", { rooms: getPublicRoomList() });
  });

  socket.on("ready_up", () => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const p = room.players.get(socket.user.id);
    if (!p) return;
    p.ready = !p.ready;
    broadcastRoom(room.id);
  });

  socket.on("close_room", () => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.user.id) return;
    cleanupRoom(room);
    room.players.forEach((p) => {
      io.to(p.socketId).emit("kicked", { message: "Host telah menutup room." });
    });
    rooms.delete(room.id);
    io.to("global_lobby").emit("global_rooms", { rooms: getPublicRoomList() });
  });

  socket.on("leave_room", () => {
    const room = findRoom(socket);
    if (room) {
      room.players.delete(socket.user.id);
      socket.leave(room.id);
      socket.join("global_lobby");
      broadcastRoom(room.id);
      io.to("global_lobby").emit("global_rooms", {
        rooms: getPublicRoomList(),
      });
    }
  });

  socket.on("send_chat", (data) => {
    const room = findRoom(socket);
    if (!room || room.state !== "LOBBY") return;
    const msg = (data.message || "").trim().slice(0, 200);
    if (!msg) return;
    const chatMsg = {
      id: Date.now(),
      userId: socket.user.id,
      username: socket.user.username,
      message: msg,
      time: Date.now(),
    };
    room.chatHistory.push(chatMsg);
    if (room.chatHistory.length > 50) room.chatHistory.shift();
    io.to(room.id).emit("chat_message", chatMsg);
  });

  socket.on("typing", (data) => {
    const room = findRoom(socket);
    if (!room) return;
    socket.to(room.id).emit("typing", {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping: data.isTyping,
    });
  });

  socket.on("disconnect", () => {
    const room = findRoom(socket);
    if (room) {
      const p = room.players.get(socket.user.id);
      if (p) {
        p.connected = false;
        p.ws = null;
      }
      if (room.hostId === socket.user.id) {
        cleanupRoom(room);
        room.players.forEach((pp) => {
          io.to(pp.socketId).emit("kicked", {
            message: "Host terputus, room ditutup.",
          });
        });
        rooms.delete(room.id);
      }
      broadcastRoom(room.id);
      io.to("global_lobby").emit("global_rooms", {
        rooms: getPublicRoomList(),
      });
    }
  });
});

function findRoom(socket) {
  for (const [id, room] of rooms) {
    if (room.players.has(socket.user.id) || room.hostId === socket.user.id)
      return room;
  }
  return null;
}

function actuallyStartGame(room) {
  const teamPlayers = {};
  room.players.forEach((p) => {
    if (!teamPlayers[p.team]) teamPlayers[p.team] = [];
    teamPlayers[p.team].push(p);
  });
  const validTeams = [];
  const invalidTeams = [];
  Object.keys(teamPlayers).forEach((t) => {
    const tNum = parseInt(t);
    const players = teamPlayers[t];
    if (players.length < 2)
      invalidTeams.push({ team: tNum, reason: "kurang anggota" });
    else if (
      !players.find((p) => p.role === "clue") ||
      !players.find((p) => p.role === "guess")
    )
      invalidTeams.push({ team: tNum, reason: "role belum lengkap" });
    else validTeams.push(tNum);
  });

  if (validTeams.length < 2) {
    io.to(room.id).emit("error", {
      message: "Minimal 2 tim penuh diperlukan untuk memulai.",
    });
    return;
  }

  invalidTeams.forEach((t) => {
    teamPlayers[t.team].forEach((p) => {
      io.to(p.socketId).emit("kicked", {
        message: "Tim kamu kekurangan anggota atau role belum lengkap.",
      });
      room.players.delete(p.user.id);
    });
  });

  if (validTeams.length < 2) return;

  room.state = "CLUE";
  room.clues = {};
  room.activeSkills = {};
  const ALL_SKILLS = ['double_point', 'extra_time', 'shield', 'emoji_chaos', 'blur_vision', 'fake_shake', 'lucky_bonus', 'risk_gamble', 'point_steal'];
  room.teamSkills = {};
  validTeams.forEach((t) => {
    const skills = [];
    const pool = [...ALL_SKILLS];
    if (Math.random() < 0.05) skills.push('ultimate');
    while(skills.length < 3) {
      const idx = Math.floor(Math.random() * pool.length);
      skills.push(pool[idx]);
      pool.splice(idx, 1);
    }
    room.teamSkills[t] = skills;
  });
  room._guessed = {};
  room._noClueTeams = [];
  room._clueLocked = {};
  room._hintsForRound = {};
  room._perusuhTeams = [];
  clearGameTimer(room);
  broadcastRoom(room.id);
  startGameTimer(room.id, 15, () => endCluePhase(room.id));
}

httpServer.listen(PORT, () => {
  console.log(`[EQ] Socket.IO server running on port ${PORT}`);
});
