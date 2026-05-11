export interface Question {
  id: number; emojis: string[]; answer: string;
  hints: string[]; category: string; difficulty: 'easy'|'medium'|'hard'; points: number;
}

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const questions: Question[] = shuffle([
  // Indonesian Questions - Budaya & Kuliner
  {id:1,emojis:['🍌','🟢','🥥'],answer:'Es Pisang Ijo',hints:['Makanan khas Makassar','Pisang dibalut adonan hijau'],category:'Kuliner',difficulty:'easy',points:100},
  {id:2,emojis:['🍚','🥘','🌶️'],answer:'Nasi Padang',hints:['Nasi dengan lauk khas Sumatera Barat','Berkuah santan kental'],category:'Kuliner',difficulty:'easy',points:100},
  {id:3,emojis:['🍜','🍗','🌶️'],answer:'Mie Ayam',hints:['Mi rebus dengan topping ayam','Bumbu kecap dan sawi'],category:'Kuliner',difficulty:'easy',points:100},
  {id:4,emojis:['🍖','🔥','🧅'],answer:'Sate Taichan',hints:['Sate tanpa kacang','Sambal dan jeruk nipis'],category:'Kuliner',difficulty:'easy',points:100},
  {id:5,emojis:['🥣','🌶️','🍘'],answer:'Seblak Pedas',hints:['Jajanan khas Bandung','Kerupuk basah dengan kencur'],category:'Kuliner',difficulty:'medium',points:150},
  {id:6,emojis:['🐟','🌶️','🥬'],answer:'Pecel Lele',hints:['Ikan goreng kering','Sambal terasi dan lalapan'],category:'Kuliner',difficulty:'easy',points:100},
  {id:7,emojis:['🧋','🧋','🧋'],answer:'Boba',hints:['Minuman teh susu','Topping bola tapioka'],category:'Minuman',difficulty:'easy',points:100},
  {id:8,emojis:['☕','🥛','🍬'],answer:'Kopi Susu',hints:['Kopi dicampur susu','Kental manis atau susu segar'],category:'Minuman',difficulty:'easy',points:100},
  // Indonesian Questions - Kehidupan Sehari-hari
  {id:9,emojis:['🏍️','📱','🍜'],answer:'Ojol',hints:['Pengemudi ojek online','Transportasi berbasis aplikasi'],category:'Profesi',difficulty:'easy',points:100},
  {id:10,emojis:['🛒','📦','🚚'],answer:'Tukang Paket',hints:['Kurir mengantar barang','Belanja online ke rumah'],category:'Profesi',difficulty:'easy',points:100},
  {id:11,emojis:['🅿️','🎫','🎤'],answer:'Tukang Parkir',hints:['Mengatur kendaraan','Bermunculan dengan peluit'],category:'Profesi',difficulty:'easy',points:100},
  {id:12,emojis:['🧂','🥣','💧'],answer:'Masuk Angin',hints:['Badan meriang','Disembuhkan dengan kerokan'],category:'Kesehatan',difficulty:'medium',points:150},
  {id:13,emojis:['🛏️','😴','🌞'],answer:'Tidur Siang',hints:['Istirahat di siang hari','Memejamkan mata saat matahari masih terang'],category:'Aktivitas',difficulty:'easy',points:100},
  {id:14,emojis:['🌧️','🧥','🏍️'],answer:'Hujan Naik Motor',hints:['Berkendara menerobos hujan','Menggunakan jas hujan'],category:'Aktivitas',difficulty:'easy',points:100},
  {id:15,emojis:['🌞','☕','🧑'],answer:'Anak Senja',hints:['Suka menikmati matahari terbenam','Minum kopi sambil view'],category:'Lifestyle',difficulty:'medium',points:150},
  // Indonesian Questions - Tempat &上班
  {id:16,emojis:['🏪','🛒','⏰'],answer:'Warung Madura',hints:['Toko kelontong','Buka 24 jam nonstop'],category:'Tempat',difficulty:'easy',points:100},
  {id:17,emojis:['☕','🍜','🪑'],answer:'Warkop',hints:['Warung kopi','Minum mi instan dan ngopi santai'],category:'Tempat',difficulty:'easy',points:100},
  {id:18,emojis:['🛋️','🗣️','👥'],answer:'Tongkrongan',hints:['Tempat kumpul','Bersama teman-teman'],category:'Tempat',difficulty:'easy',points:100},
  {id:19,emojis:['🚗','🚛','😤'],answer:'Macet Jakarta',hints:['Lalu lintas ibukota','Penuh kendaraan'],category:'Tempat',difficulty:'medium',points:150},
  // Indonesian Questions - Teknologi & Game
  {id:20,emojis:['📱','🎮','⚔️'],answer:'Mobile Legends',hints:['Game MOBA HP','Buatan Moonton'],category:'Game',difficulty:'easy',points:100},
  {id:21,emojis:['📱','📱','📱'],answer:'FYP TikTok',hints:['For You Page','Beranda rekomendasi video'],category:'Sosial',difficulty:'easy',points:100},
  {id:22,emojis:['🎮','🏆','⬆️'],answer:'Main Rank',hints:['Mode kompetitif game','Menaikkan tier atau pangkat'],category:'Game',difficulty:'easy',points:100},
  // Indonesian Questions - moments & Meme
  {id:23,emojis:['🌅','🍽️','🔔'],answer:'Buka Puasa',hints:['Waktu berbuka saat magrib','Azan berkumandang'],category:'Momen',difficulty:'easy',points:100},
  {id:24,emojis:['👕','🆕','🕌'],answer:'Baju Lebaran',hints:['Pakaian untuk Idulfitri','Beli khusus raya'],category:'Momen',difficulty:'easy',points:100},
  {id:25,emojis:['💰','📅','😰'],answer:'Tanggal Tua',hints:['Akhir bulan','Uang sisa gaji menipis'],category:'Meme',difficulty:'easy',points:100},
  {id:26,emojis:['💸','📱','📞'],answer:'Pinjol',hints:['Pinjaman online','Menagih via telepon'],category:'Viral',difficulty:'medium',points:150},
  // Indonesian Questions - Drama & Relationship
  {id:27,emojis:['💔','❤️','🔄'],answer:'Mantan Balikan',hints:['Pasangan putus lalu jalin lagi','Hubungan yang berulang'],category:'Drama',difficulty:'medium',points:150},
  {id:28,emojis:['❤️','💪','🥰'],answer:'Bucin',hints:['Budak Cinta','Rela lakukan apa demi pacar'],category:'Slang',difficulty:'medium',points:150},
  // Indonesian Questions - Nostalgia & Derita
  {id:29,emojis:['💻','🎮','👦'],answer:'Anak Warnet',hints:['Main game online di warnet','Berjam-jam'],category:'Nostalgia',difficulty:'medium',points:150},
  {id:30,emojis:['📶','📵','😤'],answer:'Sinyal Hilang',hints:['Koneksi internet putus','Loading terus'],category:'Derita',difficulty:'easy',points:100},
  {id:31,emojis:['🔑','🔍','😰'],answer:'Kunci Hilang',hints:['Tidak menemukan kunci','Benda gerigi untuk buka pintu'],category:'Derita',difficulty:'easy',points:100},
  {id:32,emojis:['👛','❌','😰'],answer:'Dompet Ketinggalan',hints:['Tertinggal di rumah','Saat mau membayar'],category:'Derita',difficulty:'easy',points:100},
  {id:33,emojis:['🔐','❌','😰'],answer:'Lupa Password',hints:['Tidak ingat kata sandi','Login media sosial'],category:'Derita',difficulty:'easy',points:100},
  {id:34,emojis:['🌙','😴','☀️'],answer:'Begadang',hints:['Terjaga tidak tidur','Hasta larut malam'],category:'Aktivitas',difficulty:'easy',points:100},
  {id:35,emojis:['🛞','💨','😰'],answer:'Ban Bocor',hints:['Roda kempis','Tertusuk paku di jalan'],category:'Derita',difficulty:'easy',points:100},
  {id:36,emojis:['💰','💸','😰'],answer:'Gajian Lewat',hints:['Uang langsung habis','Cicilan dan tagihan'],category:'Derita',difficulty:'medium',points:150},
  // Indonesian Questions -Campus
  {id:37,emojis:['👨‍🏫','📖','🎓'],answer:'Dosen Pembimbing',hints:['Guru besar','Mengawasi tugas akhir'],category:'Kampus',difficulty:'medium',points:150},
  {id:38,emojis:['📝','✏️','🔁'],answer:'Revisi Skripsi',hints:['Perbaikan tugas akhir','Setelah sidang'],category:'Kampus',difficulty:'medium',points:150},
  // Indonesian Questions - Lainnya
  {id:39,emojis:['🐈','🟠','😂'],answer:'Kucing Oyen',hints:['Kucing oranye','Sering viral dan bertingkah'],category:'Hewan',difficulty:'easy',points:100},
  {id:40,emojis:['👦','🎮','🔥'],answer:'Bocil FF',hints:['Anak kecil main Free Fire','Sebutan gaul'],category:'Viral',difficulty:'easy',points:100},
  {id:41,emojis:['🎭','👺','🌧️'],answer:'Pawang Hujan',hints:['Dikpercayaan bisa tahan hujan','Kemampuan mistis'],category:'Viral',difficulty:'medium',points:150},
  {id:42,emojis:['📅','💒','🎁'],answer:'Kondangan',hints:['Menghadiri resepsi','Pernikahan kerabat'],category:'Acara',difficulty:'easy',points:100},
  {id:43,emojis:['👩','🏍️','⬅️'],answer:'Emak Naik Motor',hints:['Ibu-ibu menyetir','Identik sen kiri belok kanan'],category:'Kehidupan',difficulty:'easy',points:100},
  {id:44,emojis:['👓','🎌','🎮'],answer:'Wibu',hints:['Terobsesi anime manga','Budaya pop Jepang'],category:'Lifestyle',difficulty:'easy',points:100},
  {id:45,emojis:['👕','☀️','🧺'],answer:'Jemur Baju',hints:['Menjemur pakaian','Di bawah terik matahari'],category:'Aktivitas',difficulty:'easy',points:100},
  {id:46,emojis:['🍟','🥔','🛒'],answer:'Beli Gorengan',hints:['Tahu tempe bakwan','Goreng di pinggir jalan'],category:'Aktivitas',difficulty:'easy',points:100},
  {id:47,emojis:['🚚','💧','🏠'],answer:'Tukang Galon',hints:['Mengantar air isi ulang','Ke rumah'],category:'Profesi',difficulty:'easy',points:100},
  {id:48,emojis:['📺','🇰🇷','😢'],answer:'Nonton Drakor',hints:['Drama Korea','Maraton serial'],category:'Hobi',difficulty:'easy',points:100},
  {id:49,emojis:['🏙️','🍡','🎁'],answer:'Sukabumi',hints:['Kota Jawa Barat','Identik Ciawi dan Mochi'],category:'Kota',difficulty:'medium',points:150},
  {id:50,emojis:['🌧️','⛈️','🌈'],answer:'Hujan Deras',hints:['Curah tinggi','Genangan di jalan'],category:'Cuaca',difficulty:'easy',points:100},
]);

export function getQuestionsByMode(mode: 'casual'|'rank'|'pvp'): Question[] {
  if (mode === 'casual') return shuffle(questions).slice(0,10);
  if (mode === 'rank') {
    const easy   = shuffle(questions.filter(q=>q.difficulty==='easy')).slice(0,4);
    const medium = shuffle(questions.filter(q=>q.difficulty==='medium')).slice(0,4);
    const hard   = shuffle(questions.filter(q=>q.difficulty==='hard')).slice(0,2);
    return shuffle([...easy,...medium,...hard]);
  }
  return shuffle(questions).slice(0,8);
}
