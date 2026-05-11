const { WebSocketServer } = require('ws');
const jwt  = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const PORT   = process.env.WS_PORT   || 3001;
const SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';

const PARTY_QUESTIONS = [

  {id:1, answer:'Es Pisang Ijo', category:'Makanan', hint:'Makanan segar khas Makassar, pisang berbalut adonan hijau dengan bubur sumsum.'},
  {id:2, answer:'Tukang Bakso', category:'Profesi', hint:'Pedagang makanan berkuah keliling menggunakan gerobak dorong atau motor.'},
  {id:3, answer:'Nasi Padang', category:'Makanan', hint:'Nasi rames dengan lauk pauk khas Sumatera Barat berkuah santan kental.'},
  {id:4, answer:'Bocil FF', category:'Viral', hint:'Sebutan gaul untuk anak kecil pemain game battle royale Free Fire.'},
  {id:5, answer:'Anak Senja', category:'Lifestyle', hint:'Orang yang identik suka minum kopi sambil menikmati pemandangan matahari terbenam.'},
  {id:6, answer:'Mobile Legends', category:'Game', hint:'Game MOBA populer di HP buatan Moonton, sering disebut ML.'},
  {id:7, answer:'Ojol', category:'Profesi', hint:'Pengemudi transportasi roda dua berbasis aplikasi.'},
  {id:8, answer:'Kucing Oyen', category:'Hewan', hint:'Sebutan viral untuk kucing oranye yang sering bertingkah ajaib.'},
  {id:9, answer:'Mie Ayam', category:'Makanan', hint:'Olahan mi rebus dengan taburan daging ayam bumbu kecap dan sawi.'},
  {id:10, answer:'Warung Madura', category:'Tempat', hint:'Toko kelontong kecil yang identik buka 24 jam nonstop.'},
  {id:11, answer:'Bucin', category:'Slang', hint:'Singkatan dari Budak Cinta, orang yang rela melakukan apa saja demi pacarnya.'},
  {id:12, answer:'Emak Naik Motor', category:'Kehidupan', hint:'Fenomena ibu-ibu menyetir motor, identik dengan sen kiri tapi belok kanan.'},
  {id:13, answer:'Masuk Angin', category:'Penyakit', hint:'Istilah medis lokal untuk badan meriang yang biasanya disembuhkan dengan kerokan.'},
  {id:14, answer:'Wibu', category:'Lifestyle', hint:'Sebutan untuk orang yang sangat terobsesi dengan budaya pop Jepang (anime/manga).'},
  {id:15, answer:'Sate Taichan', category:'Makanan', hint:'Sate daging ayam tanpa bumbu kacang/kecap, disajikan dengan sambal dan perasan jeruk nipis.'},
  {id:16, answer:'Tongkrongan', category:'Tempat', hint:'Lokasi favorit untuk berkumpul santai dan ngobrol bersama teman-teman.'},
  {id:17, answer:'Hujan Naik Motor', category:'Aktivitas', hint:'Berkendara menerobos hujan menggunakan jas hujan.'},
  {id:18, answer:'Nonton Drakor', category:'Hobi', hint:'Aktivitas maraton menonton serial drama televisi asal Korea Selatan.'},
  {id:19, answer:'Tukang Galon', category:'Profesi', hint:'Pekerja yang bertugas mengantar air minum kemasan isi ulang ke rumah.'},
  {id:20, answer:'Warkop', category:'Tempat', hint:'Warung kopi sederhana tempat minum mi instan dan ngopi santai.'},
  {id:21, answer:'FYP TikTok', category:'Viral', hint:'Halaman rekomendasi beranda (For You Page) di aplikasi video pendek.'},
  {id:22, answer:'Mantan Balikan', category:'Drama', hint:'Fenomena pasangan yang sudah putus lalu menjalin hubungan kembali.'},
  {id:23, answer:'Anak Warnet', category:'Nostalgia', hint:'Sebutan untuk generasi yang sering main game online berjam-jam di warung internet.'},
  {id:24, answer:'Main Rank', category:'Game', hint:'Mode permainan kompetitif untuk menaikkan tier atau pangkat dalam game.'},
  {id:25, answer:'Seblak Pedas', category:'Makanan', hint:'Jajanan berkuah khas Bandung berisi kerupuk basah dengan bumbu kencur ekstra pedas.'},
  {id:26, answer:'Jemur Baju', category:'Aktivitas', hint:'Menyediakan pakaian basah di bawah terik matahari agar kering.'},
  {id:27, answer:'Kondangan', category:'Acara', hint:'Menghadiri acara resepsi pernikahan kenalan atau kerabat.'},
  {id:28, answer:'Dosen Pembimbing', category:'Kampus', hint:'Guru besar/pengajar yang mengawasi penyusunan tugas akhir mahasiswa.'},
  {id:29, answer:'Revisi Skripsi', category:'Kampus', hint:'Proses perbaikan dokumen tugas akhir setelah sidang atau bimbingan.'},
  {id:30, answer:'Tanggal Tua', category:'Meme', hint:'Masa-masa akhir bulan di mana uang sisa gaji mulai menipis.'},
  {id:31, answer:'Pinjol', category:'Viral', hint:'Layanan peminjaman uang berbasis online yang sering menagih via telepon.'},
  {id:32, answer:'Beli Gorengan', category:'Aktivitas', hint:'Membeli camilan tahu, tempe, atau bakwan yang digoreng di pinggir jalan.'},
  {id:33, answer:'Tidur Siang', category:'Hobi', hint:'Kegiatan istirahat memejamkan mata di waktu matahari masih terang.'},
  {id:34, answer:'Tukang Parkir', category:'Profesi', hint:'Orang yang mengatur dan menjaga kendaraan, sering muncul tiba-tiba dengan peluit.'},
  {id:35, answer:'Buka Puasa', category:'Momen', hint:'Waktu berbuka membatalkan saum saat azan magrib berkumandang.'},
  {id:36, answer:'Baju Lebaran', category:'Momen', hint:'Pakaian baru yang dibeli khusus untuk menyambut hari raya Idulfitri.'},
  {id:37, answer:'Sinyal Hilang', category:'Derita', hint:'Kondisi ketika koneksi internet HP tiba-tiba putus atau loading terus.'},
  {id:38, answer:'Kunci Hilang', category:'Derita', hint:'Kejadian panik mencari benda kecil bergerigi untuk membuka pintu atau motor.'},
  {id:39, answer:'Dompet Ketinggalan', category:'Derita', hint:'Situasi panik saat mau membayar ternyata benda penyimpan uang tertinggal di rumah.'},
  {id:40, answer:'Pecel Lele', category:'Makanan', hint:'Lauk ikan berkumis goreng kering disajikan dengan sambal terasi dan lalapan.'},
  {id:41, answer:'Boba', category:'Minuman', hint:'Minuman teh susu dengan topping bola-bola tapioka manis kenyal.'},
  {id:42, answer:'Kopi Susu', category:'Minuman', hint:'Minuman campuran seduhan biji kopi dan kental manis atau susu segar.'},
  {id:43, answer:'Pawang Hujan', category:'Viral', hint:'Orang yang dipercaya memiliki kemampuan mistis menahan atau memindahkan hujan.'},
  {id:44, answer:'Tukang Paket', category:'Profesi', hint:'Kurir yang mengantar barang belanjaan online ke depan pintu rumah.'},
  {id:45, answer:'Macet Jakarta', category:'Tempat', hint:'Kondisi lalu lintas ibukota yang penuh kendaraan dan tak bisa bergerak.'},
  {id:46, answer:'Ban Bocor', category:'Derita', hint:'Kondisi apes saat roda kendaraan kempis tertusuk paku di jalan.'},
  {id:47, answer:'Lupa Password', category:'Derita', hint:'Tidak ingat kata sandi saat mencoba login ke akun media sosial.'},
  {id:48, answer:'Begadang', category:'Aktivitas', hint:'Terjaga tidak tidur hingga larut malam atau pagi hari.'},
  {id:49, answer:'Gajian Lewat', category:'Kehidupan', hint:'Situasi uang gaji langsung habis untuk membayar cicilan dan tagihan bulanan.'},
  {id:50, answer:'Sukabumi', category:'Kota', hint:'Kota di Jawa Barat yang identik dengan macetnya jalur Ciawi dan Mochi.'}

];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function getPartyQuestions(n = 5) { return shuffle(PARTY_QUESTIONS).slice(0, n); }

let pool;
(async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'emoji_quest',
    });
  } catch (e) {}
})();

const wss = new WebSocketServer({ port: PORT });
wss.on('listening', () => {
  console.log(`[WS] WebSocket server is running on port ${PORT}`);
});
wss.on('error', (err) => {
  console.error('[WS] WebSocket server error:', err);
});
const rooms = new Map(); // roomId -> Room details
const clients = new Map(); // ws -> { user, location }

function send(ws, data) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(data)); }
function parseToken(url) {
  try {
    const token = new URL('ws://x' + url).searchParams.get('token');
    if (token && token.startsWith('guest_')) {
      const parts = token.substring(6).split('_');
      const id = parseInt(parts[0], 10);
      const username = parts.slice(1).join('_');
      return {
        id: id,
        username: username,
        avatar_color: '#8888AA',
        avatar_url: null
      };
    }
    return jwt.verify(token, SECRET);
  } catch { return null; }
}

function broadcastGlobalRooms() {
  const publicRooms = [];
  rooms.forEach(r => {
    if(!r.isPrivate && r.state === 'LOBBY') {
      publicRooms.push({ id: r.id, name: r.name, hostName: r.hostInfo.username, playerCount: r.players.size, maxPlayers: r.maxTeams * 2, isPrivate: r.isPrivate });
    }
  });
  clients.forEach((c, ws) => {
    if(c.location === 'GLOBAL_LOBBY') send(ws, { type: 'global_rooms', rooms: publicRooms });
  });
}

function getRoomPayload(room) {
  return {
    id: room.id, name: room.name, hostId: room.hostId, hostInfo: room.hostInfo,
    isPrivate: room.isPrivate, hostPlayMode: room.hostPlayMode || "spectator", maxTeams: room.maxTeams, state: room.state,
    players: Array.from(room.players.values()).map(p => ({
      id: p.user.id, username: p.user.username, avatar_url: p.user.avatar_url, avatar_color: p.user.avatar_color, team: p.team, role: p.role
    })),
    scores: room.scores, currentQ: room.currentQ, totalQ: room.questions.length,
    activeQuestion: room.state !== 'LOBBY' && room.state !== 'RESULT' ? { category: room.questions[room.currentQ].category, answer: room.questions[room.currentQ].answer } : null,
    clues: room.clues, activeSkills: room.activeSkills, skillTargets: room.skillTargets || {},
    teamSkills: room.teamSkills || {}, usedSkills: room.usedSkills || {}, hintsRemaining: room.hintsRemaining || {}, hintsForRound: room.hintsForRound || {},
    noClueTeams: room._noClueTeams || []
  };
}

function broadcastRoom(roomId) {
  const room = rooms.get(roomId);
  if(!room) return;
  const payload = { type: 'room_update', room: getRoomPayload(room) };
  if(room.hostWs) send(room.hostWs, payload);
  room.players.forEach(p => send(p.ws, payload));
  broadcastGlobalRooms();
}

wss.on('connection', (ws, req) => {
  const user = parseToken(req.url || '/');
  if (!user) { ws.close(1008, 'Unauthorized'); return; }

  clients.set(ws, { user, location: 'GLOBAL_LOBBY' });
  broadcastGlobalRooms(); // send initial list

  ws.on('message', async (raw) => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }

    const client = clients.get(ws);
    
    switch (msg.type) {
      case 'get_rooms': {
        client.location = 'GLOBAL_LOBBY';
        broadcastGlobalRooms();
        break;
      }
      case 'create_room': {
        const roomId = msg.isPrivate ? Math.random().toString(36).substring(2, 7).toUpperCase() : Math.random().toString(36).substring(2, 9).toUpperCase();
        const room = {
          id: roomId, name: msg.name || 'Room 1', hostId: user.id, hostInfo: user, hostWs: ws,
          isPrivate: !!msg.isPrivate, hostPlayMode: msg.hostPlayMode || "spectator",
          maxTeams: Math.min(5, Math.max(2, msg.maxTeams || 2)),
          players: new Map(), state: 'LOBBY', questions: getPartyQuestions(5),
          currentQ: 0, clues: {}, scores: {}, activeSkills: {}, _swapRequests: {}, _clueLocked: {}
        };
        for(let i=1; i<=room.maxTeams; i++) room.scores[i] = 0;
        
        // If host wants to play, add them as a normal player
        if (room.hostPlayMode === "playing") {
          if (room.players.size < room.maxTeams * 2) {
            const counts = {}; for(let i=1; i<=room.maxTeams; i++) counts[i] = 0;
            room.players.forEach(p => counts[p.team]++);
            let assignedTeam = 1;
            for(let i=1; i<=room.maxTeams; i++) { if(counts[i] < 2) { assignedTeam = i; break; } }
            room.players.set(user.id, { ws, user, team: assignedTeam, role: null });
          }
        }
        
        rooms.set(roomId, room);
        client.location = roomId;
        broadcastRoom(roomId);
        break;
      }
      case 'join_room': {
        const rId = msg.roomId.toUpperCase();
        const room = rooms.get(rId);
        if(!room || room.state !== 'LOBBY') {
          send(ws, {type:'error', message:'Room tidak ditemukan atau game sudah dimulai.'});
          break;
        }
        if(room.players.size >= room.maxTeams * 2) {
          send(ws, {type:'error', message:'Room penuh.'});
          break;
        }
        
        let assignedTeam = 1;
        const counts = {}; for(let i=1; i<=room.maxTeams; i++) counts[i] = 0;
        room.players.forEach(p => counts[p.team]++);
        
        for(let i=1; i<=room.maxTeams; i++) {
          if(counts[i] < 2) { assignedTeam = i; break; }
        }
        
        let assignedRole = counts[assignedTeam] === 0 ? 'clue' : 'guess';
        room.players.set(user.id, { ws, user, team: assignedTeam, role: assignedRole });
        client.location = rId;
        broadcastRoom(rId);
        break;
      }
      case 'change_team': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'LOBBY') break;
        const p = room.players.get(user.id);
        if(!p) break;
        let c = 0; room.players.forEach(op => { if(op.team === msg.team) c++; });
        if(c < 2) { p.team = msg.team; broadcastRoom(room.id); }
        break;
      }
      case 'change_role': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'LOBBY') break;
        const p = room.players.get(user.id);
        if(!p) break;
        
        // Check if target role is taken by teammate
        const teamPlayers = [];
        room.players.forEach(op => { if(op.team === p.team) teamPlayers.push(op); });
        const takenBy = teamPlayers.find(op => op.user.id !== user.id && op.role === msg.role);
        
        if(takenBy) {
          send(ws, {type:'role_taken', teammate:{id:takenBy.user.id,username:takenBy.user.username}, desiredRole:msg.role});
          break;
        }
        
        p.role = msg.role;
        broadcastRoom(room.id);
        break;
      }
      case 'request_swap': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'LOBBY') break;
        const p = room.players.get(user.id);
        if(!p) break;
        
        if(!room._swapRequests) room._swapRequests = {};
        if(room._swapRequests[p.team]) {
          send(ws, {type:'swap_pending', message:'Masih ada permintaan tukar role yang pending.'});
          break;
        }
        
        // Find teammate
        let teammate = null;
        room.players.forEach(op => { if(op.team === p.team && op.user.id !== user.id) teammate = op; });
        if(!teammate) break;
        
        room._swapRequests[p.team] = {
          requesterId: user.id, requesterName: user.username, requesterRole: p.role,
          teammateId: teammate.user.id, teammateRole: teammate.role,
          createdAt: Date.now()
        };
        
        send(teammate.ws, {type:'role_swap_request', from:user.username, fromRole:p.role, toRole:teammate.role});
        send(ws, {type:'swap_sent', message:'Permintaan tukar role dikirim. Menunggu persetujuan...'});
        break;
      }
      case 'respond_swap': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'LOBBY') break;
        const p = room.players.get(user.id);
        if(!p) break;
        if(!room._swapRequests || !room._swapRequests[p.team]) break;
        
        const swap = room._swapRequests[p.team];
        delete room._swapRequests[p.team];
        
        if(msg.accept) {
          const requester = room.players.get(swap.requesterId);
          const teammate = room.players.get(swap.teammateId);
          if(requester && teammate) {
            const tempRole = requester.role;
            requester.role = teammate.role;
            teammate.role = tempRole;
            broadcastRoom(room.id);
            send(ws, {type:'swap_success', message:'Role berhasil ditukar.'});
            if(requester.ws) send(requester.ws, {type:'swap_success', message:'Role berhasil ditukar.'});
          }
        } else {
          const requester = room.players.get(swap.requesterId);
          if(requester) send(requester.ws, {type:'swap_rejected', message:'Pengajuan tukar role ditolak.'});
          send(ws, {type:'swap_cancelled', message:'Pengajuan dibatalkan.'});
        }
        break;
      }
      case 'reset_role': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'LOBBY') break;
        const p = room.players.get(user.id);
        if(!p) break;
        p.role = null;
        broadcastRoom(room.id);
        break;
      }
      case 'start_game': {
        const room = rooms.get(client.location);
        if(!room || room.hostId !== user.id || room.state !== 'LOBBY') break;
        
        const counts = {}; for(let i=1; i<=room.maxTeams; i++) counts[i] = { clue:0, guess:0, total:0 };
        room.players.forEach(p => { counts[p.team].total++; counts[p.team][p.role]++; });
        
        let activeTeams = 0;
        room.players.forEach(p => {
          if(counts[p.team].total === 1) {
            send(p.ws, {type:'kicked', message:'Tim kamu kekurangan anggota sehingga tidak dapat mengikuti pertandingan.'});
            room.players.delete(p.user.id);
            clients.get(p.ws).location = 'GLOBAL_LOBBY';
          } else if(counts[p.team].clue === 0 || counts[p.team].guess === 0) {
            // invalid role
            send(p.ws, {type:'kicked', message:'Tim kamu belum memilih role yang benar (harus ada 1 Clue & 1 Penebak).'});
            room.players.delete(p.user.id);
            clients.get(p.ws).location = 'GLOBAL_LOBBY';
          }
        });
        
        const validTeams = {};
        room.players.forEach(p => { validTeams[p.team] = true; });
        activeTeams = Object.keys(validTeams).length;

        if(activeTeams < 2) {
          send(ws, {type:'error', message:'Minimal ada 2 tim yang penuh (2 orang per tim dengan role berbeda) untuk memulai.'});
          break;
        }

        room.usedSkills = {};
        room.teamSkills = {};
        room.hintsRemaining = {};
        room.hintsForRound = {};
        for(let i=1; i<=room.maxTeams; i++) room.hintsRemaining[i] = 2;
        const ALL_SKILLS = ['double_point', 'shield', 'emoji_chaos', 'blur_vision', 'fake_shake', 'lucky_bonus', 'risk_gamble', 'point_steal'];
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
        startTransitionPhase(room.id);
        break;
      }
      case 'submit_clue': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'CLUE') break;
        const p = room.players.get(user.id);
        if(!p || p.role !== 'clue') break;
        if(room._clueLocked && room._clueLocked[p.team]) break;
        if(!room._clueLocked) room._clueLocked = {};
        room._clueLocked[p.team] = true;
        room.clues[p.team] = msg.emojis;
        send(ws, {type:'clue_submitted', team: p.team, emojis: msg.emojis});
        broadcastRoom(room.id);
        
        let allSubmitted = true;
        room.players.forEach(op => { if(op.role === 'clue' && !room.clues[op.team]) allSubmitted = false; });
        if(allSubmitted) { 
          clearTimeout(room._timer); 
          if(room._timerInterval) clearInterval(room._timerInterval);
          endCluePhase(room.id); 
        }
        break;
      }
      case 'submit_guess': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'GUESS') break;
        const p = room.players.get(user.id);
        if(!p || p.role !== 'guess') break;
        
        const q = room.questions[room.currentQ];
        const correct = q.answer.toLowerCase();
        const guess = (msg.guess || '').toLowerCase();
        
        if(!room._guessed) room._guessed = {};
  room.hintsForRound = {};
        if(room._guessed[p.team]) break;
        
        let pts = 0;
        let isCorrect = (guess === correct || correct.split(' ').some(w => w.length > 3 && guess.includes(w)));
        
        const isUltimate = room.activeSkills[p.team] === "ultimate";
        const isDoublePoint = room.activeSkills[p.team] === "double_point";
        const isRiskGamble = room.activeSkills[p.team] === "risk_gamble";
        const isLuckyBonus = room.activeSkills[p.team] === "lucky_bonus";
        const isPointSteal = room.activeSkills[p.team] === "point_steal";

        if(isCorrect) {
          if (isUltimate) {
            pts = 5000;
          } else if (isRiskGamble) {
            pts = 2000;
          } else {
            if(msg.timeLeft > 11) pts = 1000; 
            else if(msg.timeLeft > 7) pts = 750; 
            else pts = 500;
            
            if (isLuckyBonus) {
              pts += Math.floor(Math.random() * 9) * 100 + 200;
            }
          }
          
          if (isDoublePoint) pts *= 2;
          room.scores[p.team] += pts;
          
          if (isPointSteal) {
            let stolen = 0;
            const targetTeam = room.skillTargets?.[p.team];
            if (targetTeam && room.scores[targetTeam] !== undefined) {
               const stealAmt = 250;
               room.scores[targetTeam] = Math.max(0, (room.scores[targetTeam] || 0) - stealAmt);
               stolen += stealAmt;
               
               room.players.forEach(op => {
                 if (op.team === targetTeam) {
                   send(op.ws, {type: 'stolen_alert', fromTeam: p.team, amount: stealAmt});
                 }
               });
            }
            room.scores[p.team] += stolen;
          }
        } else {
          if (isUltimate) pts = -5000;
          else if (isRiskGamble) pts = -1000;
          else pts = -250;
          room.scores[p.team] = Math.max(0, room.scores[p.team] + pts);
        }
        
        room._guessed[p.team] = true;
        send(p.ws, {type:'guess_result', correct: isCorrect, points: pts, answer: q.answer});
        broadcastRoom(room.id);

        let allGuessed = true;
        room.players.forEach(op => { if(op.role === 'guess' && !room._guessed[op.team]) allGuessed = false; });
        if(allGuessed) { 
          clearTimeout(room._timer); 
          if(room._timerInterval) clearInterval(room._timerInterval);
          nextQuestion(room.id); 
        }
        break;
      }
            case 'use_hint': {
        const room = rooms.get(client.location);
        if(!room || room.state !== 'GUESS') break;
        const p = room.players.get(user.id);
        if(!p || p.role !== 'guess') break;
        if(room.hintsRemaining[p.team] > 0 && !room.hintsForRound[p.team]) {
          room.hintsRemaining[p.team]--;
          room.hintsForRound[p.team] = room.questions[room.currentQ].hint || 'Tidak ada petunjuk spesifik.';
          broadcastRoom(room.id);
        }
        break;
      }
      case 'use_skill': {
        const room = rooms.get(client.location);
        if(!room || room.state === 'LOBBY' || room.state === 'RESULT') break;
        const p = room.players.get(user.id);
        if(!p) break;
        
        if (!room.usedSkills) room.usedSkills = {};
        if (!room.usedSkills[p.team]) room.usedSkills[p.team] = {};
        if (room.usedSkills[p.team][msg.skillId]) break; // Already used
        if (room.activeSkills[p.team]) break; // 1 skill per question
        
        const usedCount = Object.keys(room.usedSkills[p.team]).length;
        if (usedCount >= 3) break; // limit
        
        room.activeSkills[p.team] = msg.skillId;
        room.usedSkills[p.team][msg.skillId] = true;
        
        const targetableTeams = [];
        for(let i=1; i<=room.maxTeams; i++) {
          if (i !== p.team) targetableTeams.push(i);
        }
        const targetTeam = targetableTeams[Math.floor(Math.random() * targetableTeams.length)];
        
        if (!room.skillTargets) room.skillTargets = {};
        room.skillTargets[p.team] = targetTeam;
        
        // broadcast skill_used
        const payload = { type: 'skill_used', team: p.team, skillId: msg.skillId, playerName: user.username, targetTeam };
        if(room.hostWs) send(room.hostWs, payload);
        room.players.forEach(op => {
          send(op.ws, payload);
          if (['emoji_chaos', 'blur_vision', 'fake_shake'].includes(msg.skillId) && op.team === targetTeam) {
            send(op.ws, { type: 'debuff_alert', skillId: msg.skillId, fromTeam: p.team });
          }
        });
        
        broadcastRoom(room.id);
        break;
      }
      case 'chat_message': {
        const room = rooms.get(client.location);
        if(!room || !msg.message || !msg.message.trim()) break;
        const p = room.players.get(user.id);
        if(!p) break;
        const chatPayload = { 
          type: 'chat_message', 
          playerId: user.id, 
          playerName: user.username, 
          message: msg.message.trim().substring(0, 200),
          team: p.team,
          timestamp: Date.now()
        };
        if(room.hostWs) send(room.hostWs, chatPayload);
        room.players.forEach(op => send(op.ws, chatPayload));
        break;
      }
      case 'play_again': {
        const room = rooms.get(client.location);
        if(!room || room.hostId !== user.id) break;
        if(room._timerInterval) clearInterval(room._timerInterval);
        if(room._timer) clearTimeout(room._timer);
        room.state = 'LOBBY';
        room.currentQ = 0;
        for(let i=1; i<=room.maxTeams; i++) room.scores[i] = 0;
        room.clues = {};
        room.activeSkills = {};
        room._guessed = {};
        room._clueLocked = {};
        room._swapRequests = {};
        room._timeLeft = 0;
        room.questions = getPartyQuestions(5);
        broadcastRoom(room.id);
        break;
      }
      case 'close_room': {
        const room = rooms.get(client.location);
        if(!room || room.hostId !== user.id) break;
        room.players.forEach(p => {
          send(p.ws, {type:'kicked', message:'Host telah menutup Room.'});
          clients.get(p.ws).location = 'GLOBAL_LOBBY';
        });
        rooms.delete(room.id);
        client.location = 'GLOBAL_LOBBY';
        broadcastGlobalRooms();
        break;
      }
      case 'leave_room': {
        const room = rooms.get(client.location);
        if(room) {
          room.players.delete(user.id);
          client.location = 'GLOBAL_LOBBY';
          broadcastRoom(room.id);
        }
        break;
      }
      case 'kick_player': {
        const room = rooms.get(client.location);
        if(!room || room.hostId !== user.id) break;
        const targetId = msg.playerId;
        const targetPlayer = room.players.get(targetId);
        if(!targetPlayer || targetId === user.id) break;
        send(targetPlayer.ws, {type:'kicked', message:'Kamu dikeluarkan dari room oleh host.'});
        room.players.delete(targetId);
        if(clients.get(targetPlayer.ws)) clients.get(targetPlayer.ws).location = 'GLOBAL_LOBBY';
        broadcastRoom(room.id);
        break;
      }
    }
  });

  ws.on('close', () => {
    const loc = clients.get(ws)?.location;
    clients.delete(ws);
    if(loc && loc !== 'GLOBAL_LOBBY') {
      const room = rooms.get(loc);
      if(room) {
        if(room.hostId === user.id) {
          // Host disconnected, close room
          room.players.forEach(p => {
            send(p.ws, {type:'kicked', message:'Host terputus, room ditutup.'});
            if(clients.has(p.ws)) clients.get(p.ws).location = 'GLOBAL_LOBBY';
          });
          rooms.delete(room.id);
          broadcastGlobalRooms();
        } else {
          room.players.delete(user.id);
          broadcastRoom(room.id);
        }
      }
    }
  });
});

function startTransitionPhase(roomId) {
  const room = rooms.get(roomId);
  if(!room) return;
  if(room._timerInterval) clearInterval(room._timerInterval);
  if(room._timer) clearTimeout(room._timer);
  room.state = 'TRANSITION';
  room.clues = {};
  room.activeSkills = {};
  room._clueLocked = {};
  broadcastRoom(roomId);
  
  room._timeLeft = 3;
  room.players.forEach(p => send(p.ws, {type: 'timer_tick', seconds: room._timeLeft}));
  
  room._timerInterval = setInterval(() => {
    room._timeLeft--;
    room.players.forEach(p => send(p.ws, {type: 'timer_tick', seconds: room._timeLeft}));
    if(room._timeLeft <= 0) {
      clearInterval(room._timerInterval);
      startCluePhase(roomId);
    }
  }, 1000);
}

function startCluePhase(roomId) {
  const room = rooms.get(roomId);
  if(!room) return;
  if(room._timerInterval) clearInterval(room._timerInterval);
  if(room._timer) clearTimeout(room._timer);
  room.state = 'CLUE';
  broadcastRoom(roomId);
  
  room._timeLeft = 60;
  room.players.forEach(p => send(p.ws, {type: 'timer_tick', seconds: room._timeLeft}));
  
  room._timerInterval = setInterval(() => {
    room._timeLeft--;
    room.players.forEach(p => send(p.ws, {type: 'timer_tick', seconds: room._timeLeft}));
    if(room._timeLeft <= 0) {
      clearInterval(room._timerInterval);
      endCluePhase(roomId);
    }
  }, 1000);
}

function endCluePhase(roomId) {
  const room = rooms.get(roomId);
  if(!room) return;
  if(room._timerInterval) clearInterval(room._timerInterval);
  if(room._timer) clearTimeout(room._timer);
  room.state = 'GUESS';
  room._guessed = {};
  room.hintsForRound = {};
  room._teamExtraTime = {};
  
  // Check teams that didn't submit clue and apply penalty
  const noClueTeams = [];
  for (let t = 1; t <= room.maxTeams; t++) {
    if (!room.clues[t] || !room.clues[t].trim()) {
      noClueTeams.push(t);
      room.scores[t] = Math.max(0, (room.scores[t] || 0) - 250);
    }
  }
  room._noClueTeams = noClueTeams;
  
  // Include no-clue info in room payload
  broadcastRoom(roomId);
  
  // Start guess timer with tick updates
  room._timeLeft = 15;
  room.players.forEach(p => send(p.ws, {type: 'timer_tick', seconds: room._timeLeft}));
  
  room._timerInterval = setInterval(() => {
    room._timeLeft--;
    room.players.forEach(p => {
      const extra = (room._teamExtraTime && room._teamExtraTime[p.team]) ? room._teamExtraTime[p.team] : 0;
      const personalTime = Math.max(0, room._timeLeft + extra);
      send(p.ws, {type: 'timer_tick', seconds: personalTime});
    });
    
    let maxTimeLeft = room._timeLeft;
    if (room._teamExtraTime) {
      for (const t in room._teamExtraTime) {
        if (room._timeLeft + room._teamExtraTime[t] > maxTimeLeft) {
          maxTimeLeft = room._timeLeft + room._teamExtraTime[t];
        }
      }
    }

    if(maxTimeLeft <= 0) {
      clearInterval(room._timerInterval);
      nextQuestion(roomId);
    }
  }, 1000);
}

function nextQuestion(roomId) {
  const room = rooms.get(roomId);
  if(!room) return;
  
  // No-answer penalty for teams with ultimate active
  if(room.activeSkills && room._guessed) {
    Object.keys(room.activeSkills).forEach(t => {
      if(room.activeSkills[t] === 'ultimate' && !room._guessed[parseInt(t)]) {
        room.scores[parseInt(t)] = (room.scores[parseInt(t)] || 0) - 2500;
      }
    });
  }
  
  room.currentQ++;
  if(room.currentQ >= room.questions.length) {
    room.state = 'RESULT';
    broadcastRoom(roomId);
    if(pool) room.players.forEach(p => pool.execute('UPDATE users SET total_games=total_games+1 WHERE id=?', [p.user.id]).catch(()=>{}));
  } else {
    startTransitionPhase(roomId);
  }
}
