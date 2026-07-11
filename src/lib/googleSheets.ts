import { 
  Pengguna, 
  Siswa, 
  JadwalPelajaran, 
  AbsenSiswa, 
  JurnalMengajar, 
  TugasSiswa, 
  NilaiSiswa, 
  BimbinganSiswa, 
  PiketKelas, 
  RefleksiGuru, 
  InventarisKelas,
  UserRole,
  AppDatabase
} from '../types';

// Storage keys
const SPREADSHEET_ID_KEY = 'supervisi_sd_spreadsheet_id';
const LOCAL_DATA_PREFIX = 'supervisi_sd_data_';

// Initial Mock/Sample Data
const INITIAL_PENGGUNA: Pengguna[] = [
  { email: 'achmadfirmansyah221@guru.sd.belajar.id', nama: 'Achmad Firmansyah, S.Pd., M.Pd.', peran: 'Kepala Sekolah', noHp: '081234567890' },
  { email: 'guru.kelas1@sd.id', nama: 'Siti Aminah, S.Pd.', peran: 'Guru Kelas 1', noHp: '081234567891' },
  { email: 'guru.kelas5@sd.id', nama: 'Hendra Wijaya, S.Pd.', peran: 'Guru Kelas 5', noHp: '081234567895' },
  { email: 'guru.kelas6@sd.id', nama: 'Rina Kartika, S.Pd.', peran: 'Guru Kelas 6', noHp: '081234567896' },
  { email: 'guru.pai@sd.id', nama: 'Ustadz Ahmad Fauzi, S.Ag.', peran: 'Guru Mapel PAI', noHp: '081234567801' },
  { email: 'guru.pjok@sd.id', nama: 'Budi Santoso, S.Pd.Jas.', peran: 'Guru Mapel PJOK', noHp: '081234567802' },
  { email: 'guru.english@sd.id', nama: 'Miss Jane Doe, M.Pd.', peran: 'Guru Mapel Bahasa Inggris', noHp: '081234567803' }
];

const INITIAL_SISWA: Siswa[] = [
  // Kelas 6
  { id: 'S601', kelas: '6', nama: 'Budi Utomo', nisn: '0123456701', jenisKelamin: 'L', gayaBelajar: 'Visual', catatan: 'Suka membaca modul bergambar' },
  { id: 'S602', kelas: '6', nama: 'Siti Rahma', nisn: '0123456702', jenisKelamin: 'P', gayaBelajar: 'Auditori', catatan: 'Sangat paham jika dijelaskan secara lisan' },
  { id: 'S603', kelas: '6', nama: 'Andi Wijaya', nisn: '0123456703', jenisKelamin: 'L', gayaBelajar: 'Kinestetik', catatan: 'Butuh aktivitas fisik / praktik' },
  { id: 'S604', kelas: '6', nama: 'Ayu Lestari', nisn: '0123456704', jenisKelamin: 'P', gayaBelajar: 'Campuran', catatan: 'Gabungan visual dan kinestetik' },
  { id: 'S605', kelas: '6', nama: 'Dimas Aditya', nisn: '0123456705', jenisKelamin: 'L', gayaBelajar: 'Belum Diidentifikasi', catatan: '' },
  
  // Kelas 5
  { id: 'S501', kelas: '5', nama: 'Farhan Maulana', nisn: '0123456501', jenisKelamin: 'L', gayaBelajar: 'Visual', catatan: 'Fokus pada peta konsep' },
  { id: 'S502', kelas: '5', nama: 'Laila Fitriani', nisn: '0123456502', jenisKelamin: 'P', gayaBelajar: 'Auditori', catatan: 'Suka berdiskusi kelompok' },
  { id: 'S503', kelas: '5', nama: 'Riko Pratama', nisn: '0123456503', jenisKelamin: 'L', gayaBelajar: 'Kinestetik', catatan: 'Senang menggunakan alat peraga matematika' },
  { id: 'S504', kelas: '5', nama: 'Zahra Maulida', nisn: '0123456504', jenisKelamin: 'P', gayaBelajar: 'Visual', catatan: '' }
];

const INITIAL_JADWAL: JadwalPelajaran[] = [
  // Kelas 6
  { id: 'J601', kelas: '6', hari: 'Senin', jamKe: '07:00 - 08:30', mataPelajaran: 'Matematika', guru: 'Rina Kartika, S.Pd.' },
  { id: 'J602', kelas: '6', hari: 'Senin', jamKe: '08:30 - 10:00', mataPelajaran: 'Bahasa Indonesia', guru: 'Rina Kartika, S.Pd.' },
  { id: 'J603', kelas: '6', hari: 'Selasa', jamKe: '07:00 - 08:30', mataPelajaran: 'PJOK', guru: 'Budi Santoso, S.Pd.Jas.' },
  { id: 'J604', kelas: '6', hari: 'Selasa', jamKe: '08:30 - 10:00', mataPelajaran: 'IPA', guru: 'Rina Kartika, S.Pd.' },
  { id: 'J605', kelas: '6', hari: 'Rabu', jamKe: '07:00 - 08:30', mataPelajaran: 'PAI', guru: 'Ustadz Ahmad Fauzi, S.Ag.' },
  { id: 'J606', kelas: '6', hari: 'Rabu', jamKe: '08:30 - 10:00', mataPelajaran: 'Bahasa Inggris', guru: 'Miss Jane Doe, M.Pd.' },
  
  // Kelas 5
  { id: 'J501', kelas: '5', hari: 'Senin', jamKe: '07:00 - 08:30', mataPelajaran: 'IPA', guru: 'Hendra Wijaya, S.Pd.' },
  { id: 'J502', kelas: '5', hari: 'Senin', jamKe: '08:30 - 10:00', mataPelajaran: 'Matematika', guru: 'Hendra Wijaya, S.Pd.' },
  { id: 'J503', kelas: '5', hari: 'Selasa', jamKe: '07:00 - 08:30', mataPelajaran: 'PAI', guru: 'Ustadz Ahmad Fauzi, S.Ag.' },
  { id: 'J504', kelas: '5', hari: 'Selasa', jamKe: '08:30 - 10:00', mataPelajaran: 'IPS', guru: 'Hendra Wijaya, S.Pd.' }
];

const INITIAL_ABSEN: AbsenSiswa[] = [
  { id: 'A01', tanggal: '2026-07-10', kelas: '6', siswaId: 'S601', namaSiswa: 'Budi Utomo', status: 'Hadir', keterangan: '' },
  { id: 'A02', tanggal: '2026-07-10', kelas: '6', siswaId: 'S602', namaSiswa: 'Siti Rahma', status: 'Hadir', keterangan: '' },
  { id: 'A03', tanggal: '2026-07-10', kelas: '6', siswaId: 'S603', namaSiswa: 'Andi Wijaya', status: 'Izin', keterangan: 'Acara keluarga' },
  { id: 'A04', tanggal: '2026-07-10', kelas: '6', siswaId: 'S604', namaSiswa: 'Ayu Lestari', status: 'Hadir', keterangan: '' },
  { id: 'A05', tanggal: '2026-07-10', kelas: '6', siswaId: 'S605', namaSiswa: 'Dimas Aditya', status: 'Sakit', keterangan: 'Demam tinggi' }
];

const INITIAL_JURNAL: JurnalMengajar[] = [
  { id: 'JR01', tanggal: '2026-07-10', guruEmail: 'guru.kelas6@sd.id', guruNama: 'Rina Kartika, S.Pd.', kelas: '6', mataPelajaran: 'Matematika', materi: 'Operasi Hitung Pecahan', kegiatan: 'Menjelaskan konsep perkalian pecahan menggunakan media kertas lipat dan latihan soal.', refleksi: 'Siswa gaya belajar kinestetik sangat terbantu dengan kertas lipat, sedangkan visual paham lewat gambar papan tulis.', hambatan: 'Beberapa siswa lambat dalam perkalian dasar.' },
  { id: 'JR02', tanggal: '2026-07-10', guruEmail: 'guru.pjok@sd.id', guruNama: 'Budi Santoso, S.Pd.Jas.', kelas: '6', mataPelajaran: 'PJOK', materi: 'Bola Basket - Dribbling', kegiatan: 'Praktik dribbling bola basket di lapangan sekolah secara berpasangan.', refleksi: 'Siswa kinestetik sangat antusias dan mendominasi permainan.', hambatan: 'Bola basket terbatas, siswa harus antre.' }
];

const INITIAL_TUGAS: TugasSiswa[] = [
  { id: 'T01', kelas: '6', mataPelajaran: 'Matematika', judulTugas: 'Latihan Soal Pecahan Campuran', deskripsi: 'Mengerjakan Buku Paket halaman 25, soal nomor 1 sampai 10 di buku PR.', tanggalBatas: '2026-07-15' },
  { id: 'T02', kelas: '6', mataPelajaran: 'IPA', judulTugas: 'Laporan Adaptasi Tumbuhan', deskripsi: 'Amatilah 3 jenis tumbuhan di sekitar rumahmu, tulis cara beradaptasinya dalam bentuk tabel.', tanggalBatas: '2026-07-17' }
];

const INITIAL_NILAI: NilaiSiswa[] = [
  { id: 'N01', siswaId: 'S601', namaSiswa: 'Budi Utomo', kelas: '6', mataPelajaran: 'Matematika', jenisNilai: 'Tugas', nilai: 85 },
  { id: 'N02', siswaId: 'S602', namaSiswa: 'Siti Rahma', kelas: '6', mataPelajaran: 'Matematika', jenisNilai: 'Tugas', nilai: 90 },
  { id: 'N03', siswaId: 'S604', namaSiswa: 'Ayu Lestari', kelas: '6', mataPelajaran: 'Matematika', jenisNilai: 'Tugas', nilai: 88 },
  { id: 'N04', siswaId: 'S601', namaSiswa: 'Budi Utomo', kelas: '6', mataPelajaran: 'IPA', jenisNilai: 'Ulangan Harian', nilai: 78 }
];

const INITIAL_BIMBINGAN: BimbinganSiswa[] = [
  { id: 'B01', tanggal: '2026-07-09', kelas: '6', siswaId: 'S603', namaSiswa: 'Andi Wijaya', masalah: 'Sering mengganggu teman sebangku saat belajar mandiri.', solusi: 'Melakukan konseling individu dan memindahkan posisi duduk Andi agar berada di dekat guru.', tindakLanjut: 'Andi dipantau selama 1 minggu, diberikan tugas tambahan manipulatif agar fokus kinestetiknya tersalurkan.' }
];

const INITIAL_PIKET: PiketKelas[] = [
  { id: 'P601', kelas: '6', hari: 'Senin', namaSiswa: 'Budi Utomo, Siti Rahma' },
  { id: 'P602', kelas: '6', hari: 'Selasa', namaSiswa: 'Andi Wijaya, Ayu Lestari' },
  { id: 'P603', kelas: '6', hari: 'Rabu', namaSiswa: 'Dimas Aditya, Budi Utomo' },
  { id: 'P604', kelas: '6', hari: 'Kamis', namaSiswa: 'Siti Rahma, Ayu Lestari' },
  { id: 'P605', kelas: '6', hari: 'Jumat', namaSiswa: 'Andi Wijaya, Dimas Aditya' }
];

const INITIAL_REFLEKSI: RefleksiGuru[] = [
  { id: 'R01', tanggal: '2026-07-10', guruEmail: 'guru.kelas6@sd.id', guruNama: 'Rina Kartika, S.Pd.', kelas: '6', refleksiDiri: 'Pembelajaran matematika minggu ini berjalan lancar. Pembagian kelompok berdasarkan gaya belajar membuat suasana kelas lebih aktif dan kondusif.', rencanaTindakLanjut: 'Merancang media audio untuk materi IPA berikutnya agar merangkul siswa auditori secara optimal.', kalimatMotivasi: 'Mendidik dengan hati, mengajar dengan bukti, menuntun masa depan anak negeri.' }
];

const INITIAL_INVENTARIS: InventarisKelas[] = [
  { id: 'I01', kelas: '6', namaBarang: 'Papan Tulis Putih', jumlah: 1, kondisi: 'Baik', sumber: 'BOS' },
  { id: 'I02', kelas: '6', namaBarang: 'Kipas Angin Dinding', jumlah: 2, kondisi: 'Baik', sumber: 'Iuran Kelas' },
  { id: 'I03', kelas: '6', namaBarang: 'Alat Peraga Pecahan', jumlah: 1, kondisi: 'Baik', sumber: 'BOS' },
  { id: 'I04', kelas: '6', namaBarang: 'Sapu Ijuk', jumlah: 4, kondisi: 'Rusak Ringan', sumber: 'Iuran Kelas' }
];

// In-Memory Global Application State Cache

export const getLocalData = (): AppDatabase => {
  const defaultDb: AppDatabase = {
    pengguna: INITIAL_PENGGUNA,
    siswa: INITIAL_SISWA,
    jadwal: INITIAL_JADWAL,
    absen: INITIAL_ABSEN,
    jurnal: INITIAL_JURNAL,
    tugas: INITIAL_TUGAS,
    nilai: INITIAL_NILAI,
    bimbingan: INITIAL_BIMBINGAN,
    piket: INITIAL_PIKET,
    refleksi: INITIAL_REFLEKSI,
    inventaris: INITIAL_INVENTARIS
  };

  const db: any = {};
  const keys: (keyof AppDatabase)[] = [
    'pengguna', 'siswa', 'jadwal', 'absen', 'jurnal', 
    'tugas', 'nilai', 'bimbingan', 'piket', 'refleksi', 'inventaris'
  ];

  for (const key of keys) {
    const saved = localStorage.getItem(LOCAL_DATA_PREFIX + key);
    if (saved) {
      try {
        db[key] = JSON.parse(saved);
      } catch (e) {
        db[key] = defaultDb[key];
      }
    } else {
      db[key] = defaultDb[key];
      localStorage.setItem(LOCAL_DATA_PREFIX + key, JSON.stringify(defaultDb[key]));
    }
  }

  return db as AppDatabase;
};

export const saveLocalData = (key: keyof AppDatabase, data: any) => {
  localStorage.setItem(LOCAL_DATA_PREFIX + key, JSON.stringify(data));
};

export const saveFullLocalData = (db: AppDatabase) => {
  const keys: (keyof AppDatabase)[] = [
    'pengguna', 'siswa', 'jadwal', 'absen', 'jurnal', 
    'tugas', 'nilai', 'bimbingan', 'piket', 'refleksi', 'inventaris'
  ];
  for (const key of keys) {
    localStorage.setItem(LOCAL_DATA_PREFIX + key, JSON.stringify(db[key]));
  }
};

// Spreadsheet API Operations
export const getSpreadsheetId = (): string | null => {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
};

export const setSpreadsheetId = (id: string) => {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
};

export const deleteSpreadsheetId = () => {
  localStorage.removeItem(SPREADSHEET_ID_KEY);
};

// Help helper for headers list mapping
const HEADER_MAP: Record<keyof AppDatabase, string[]> = {
  pengguna: ['Email', 'Nama', 'Peran', 'NoHP'],
  siswa: ['ID', 'Kelas', 'Nama', 'NISN', 'Jenis Kelamin', 'Gaya Belajar', 'Catatan'],
  jadwal: ['ID', 'Kelas', 'Hari', 'Jam Ke', 'Mata Pelajaran', 'Guru'],
  absen: ['ID', 'Tanggal', 'Kelas', 'Siswa ID', 'Nama Siswa', 'Status', 'Keterangan'],
  jurnal: ['ID', 'Tanggal', 'Guru Email', 'Guru Nama', 'Kelas', 'Mata Pelajaran', 'Materi', 'Kegiatan', 'Refleksi', 'Hambatan'],
  tugas: ['ID', 'Kelas', 'Mata Pelajaran', 'Judul Tugas', 'Deskripsi', 'Tanggal Batas'],
  nilai: ['ID', 'Siswa ID', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Jenis Nilai', 'Nilai'],
  bimbingan: ['ID', 'Tanggal', 'Kelas', 'Siswa ID', 'Nama Siswa', 'Masalah', 'Solusi', 'Tindak Lanjut'],
  piket: ['ID', 'Kelas', 'Hari', 'Nama Siswa'],
  refleksi: ['ID', 'Tanggal', 'Guru Email', 'Guru Nama', 'Kelas', 'Refleksi Diri', 'Rencana Tindak Lanjut', 'Kalimat Motivasi'],
  inventaris: ['ID', 'Kelas', 'Nama Barang', 'Jumlah', 'Kondisi', 'Sumber']
};

// Convert DB rows into Google Sheets rows
const serializeRows = (key: keyof AppDatabase, items: any[]): any[][] => {
  const headers = HEADER_MAP[key];
  const rows: any[][] = [headers];

  for (const item of items) {
    const row: any[] = [];
    if (key === 'pengguna') {
      const p = item as Pengguna;
      row.push(p.email || '', p.nama || '', p.peran || '', p.noHp || '');
    } else if (key === 'siswa') {
      const s = item as Siswa;
      row.push(s.id || '', s.kelas || '', s.nama || '', s.nisn || '', s.jenisKelamin || '', s.gayaBelajar || '', s.catatan || '');
    } else if (key === 'jadwal') {
      const j = item as JadwalPelajaran;
      row.push(j.id || '', j.kelas || '', j.hari || '', j.jamKe || '', j.mataPelajaran || '', j.guru || '');
    } else if (key === 'absen') {
      const a = item as AbsenSiswa;
      row.push(a.id || '', a.tanggal || '', a.kelas || '', a.siswaId || '', a.namaSiswa || '', a.status || '', a.keterangan || '');
    } else if (key === 'jurnal') {
      const jr = item as JurnalMengajar;
      row.push(jr.id || '', jr.tanggal || '', jr.guruEmail || '', jr.guruNama || '', jr.kelas || '', jr.mataPelajaran || '', jr.materi || '', jr.kegiatan || '', jr.refleksi || '', jr.hambatan || '');
    } else if (key === 'tugas') {
      const t = item as TugasSiswa;
      row.push(t.id || '', t.kelas || '', t.mataPelajaran || '', t.judulTugas || '', t.deskripsi || '', t.tanggalBatas || '');
    } else if (key === 'nilai') {
      const n = item as NilaiSiswa;
      row.push(n.id || '', n.siswaId || '', n.namaSiswa || '', n.kelas || '', n.mataPelajaran || '', n.jenisNilai || '', n.nilai || 0);
    } else if (key === 'bimbingan') {
      const b = item as BimbinganSiswa;
      row.push(b.id || '', b.tanggal || '', b.kelas || '', b.siswaId || '', b.namaSiswa || '', b.masalah || '', b.solusi || '', b.tindakLanjut || '');
    } else if (key === 'piket') {
      const p = item as PiketKelas;
      row.push(p.id || '', p.kelas || '', p.hari || '', p.namaSiswa || '');
    } else if (key === 'refleksi') {
      const r = item as RefleksiGuru;
      row.push(r.id || '', r.tanggal || '', r.guruEmail || '', r.guruNama || '', r.kelas || '', r.refleksiDiri || '', r.rencanaTindakLanjut || '', r.kalimatMotivasi || '');
    } else if (key === 'inventaris') {
      const i = item as InventarisKelas;
      row.push(i.id || '', i.kelas || '', i.namaBarang || '', i.jumlah || 0, i.kondisi || '', i.sumber || '');
    }
    rows.push(row);
  }
  return rows;
};

// Deserialize Sheets rows into DB structures
const deserializeRows = (key: keyof AppDatabase, rows: any[][]): any[] => {
  if (!rows || rows.length <= 1) return [];
  const items: any[] = [];
  const header = rows[0];

  // Map header column indices
  const idx = (colName: string) => header.findIndex(h => h && h.trim().toLowerCase() === colName.toLowerCase());

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const val = (colName: string, defaultVal: string = '') => {
      const i = idx(colName);
      if (i === -1 || i >= row.length) return defaultVal;
      return row[i] !== undefined ? String(row[i]).trim() : defaultVal;
    };

    if (key === 'pengguna') {
      items.push({
        email: val('Email') || val('Email Pengguna'),
        nama: val('Nama') || val('Nama Pengguna'),
        peran: (val('Peran') || 'Guru Kelas 1') as UserRole,
        noHp: val('NoHP') || val('No HP')
      });
    } else if (key === 'siswa') {
      items.push({
        id: val('ID'),
        kelas: val('Kelas'),
        nama: val('Nama') || val('Nama Siswa'),
        nisn: val('NISN'),
        jenisKelamin: val('Jenis Kelamin') === 'P' ? 'P' : 'L',
        gayaBelajar: (val('Gaya Belajar') || 'Belum Diidentifikasi') as any,
        catatan: val('Catatan')
      });
    } else if (key === 'jadwal') {
      items.push({
        id: val('ID'),
        kelas: val('Kelas'),
        hari: (val('Hari') || 'Senin') as any,
        jamKe: val('Jam Ke'),
        mataPelajaran: val('Mata Pelajaran'),
        guru: val('Guru')
      });
    } else if (key === 'absen') {
      items.push({
        id: val('ID'),
        tanggal: val('Tanggal'),
        kelas: val('Kelas'),
        siswaId: val('Siswa ID') || val('ID Siswa'),
        namaSiswa: val('Nama Siswa'),
        status: (val('Status') || 'Hadir') as any,
        keterangan: val('Keterangan')
      });
    } else if (key === 'jurnal') {
      items.push({
        id: val('ID'),
        tanggal: val('Tanggal'),
        guruEmail: val('Guru Email'),
        guruNama: val('Guru Nama'),
        kelas: val('Kelas'),
        mataPelajaran: val('Mata Pelajaran'),
        materi: val('Materi'),
        kegiatan: val('Kegiatan'),
        refleksi: val('Refleksi'),
        hambatan: val('Hambatan')
      });
    } else if (key === 'tugas') {
      items.push({
        id: val('ID'),
        kelas: val('Kelas'),
        mataPelajaran: val('Mata Pelajaran'),
        judulTugas: val('Judul Tugas'),
        deskripsi: val('Deskripsi'),
        tanggalBatas: val('Tanggal Batas')
      });
    } else if (key === 'nilai') {
      items.push({
        id: val('ID'),
        siswaId: val('Siswa ID'),
        namaSiswa: val('Nama Siswa'),
        kelas: val('Kelas'),
        mataPelajaran: val('Mata Pelajaran'),
        jenisNilai: (val('Jenis Nilai') || 'Tugas') as any,
        nilai: Number(val('Nilai')) || 0
      });
    } else if (key === 'bimbingan') {
      items.push({
        id: val('ID'),
        tanggal: val('Tanggal'),
        kelas: val('Kelas'),
        siswaId: val('Siswa ID'),
        namaSiswa: val('Nama Siswa'),
        masalah: val('Masalah'),
        solusi: val('Solusi'),
        tindakLanjut: val('Tindak Lanjut')
      });
    } else if (key === 'piket') {
      items.push({
        id: val('ID'),
        kelas: val('Kelas'),
        hari: (val('Hari') || 'Senin') as any,
        namaSiswa: val('Nama Siswa')
      });
    } else if (key === 'refleksi') {
      items.push({
        id: val('ID'),
        tanggal: val('Tanggal'),
        guruEmail: val('Guru Email'),
        guruNama: val('Guru Nama'),
        kelas: val('Kelas'),
        refleksiDiri: val('Refleksi Diri'),
        rencanaTindakLanjut: val('Rencana Tindak Lanjut'),
        kalimatMotivasi: val('Kalimat Motivasi')
      });
    } else if (key === 'inventaris') {
      items.push({
        id: val('ID'),
        kelas: val('Kelas'),
        namaBarang: val('Nama Barang'),
        jumlah: Number(val('Jumlah')) || 0,
        kondisi: (val('Kondisi') || 'Baik') as any,
        sumber: val('Sumber')
      });
    }
  }

  return items;
};

// Search for existing spreadsheet or create one
export const findOrCreateSpreadsheet = async (accessToken: string, schoolName: string = 'SDN Supervisi'): Promise<string> => {
  const cachedId = getSpreadsheetId();
  if (cachedId) {
    try {
      // Validate sheet accessibility
      const verifyRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cachedId}?fields=spreadsheetId`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (verifyRes.ok) {
        return cachedId;
      }
    } catch (e) {
      console.warn('Cached spreadsheet invalid, searching Drive...', e);
    }
  }

  try {
    const searchName = `Aplikasi Supervisi Guru SD - ${schoolName}`;
    const query = encodeURIComponent(`name = '${searchName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        setSpreadsheetId(fileId);
        return fileId;
      }
    }

    // Creating a new Spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        properties: {
          title: searchName
        },
        sheets: [
          { properties: { title: 'Pengguna' } },
          { properties: { title: 'Siswa' } },
          { properties: { title: 'Jadwal' } },
          { properties: { title: 'Absen' } },
          { properties: { title: 'Jurnal' } },
          { properties: { title: 'Tugas' } },
          { properties: { title: 'Nilai' } },
          { properties: { title: 'Bimbingan' } },
          { properties: { title: 'Piket' } },
          { properties: { title: 'Refleksi' } },
          { properties: { title: 'Inventaris' } }
        ]
      })
    });

    if (!createRes.ok) {
      throw new Error('Gagal membuat Spreadsheet baru di Google Drive Anda.');
    }

    const createdSheet = await createRes.json();
    const newSheetId = createdSheet.spreadsheetId;
    setSpreadsheetId(newSheetId);

    // Seed Spreadsheet with current local cache/mock data
    const localDb = getLocalData();
    await pushFullDataToSheets(accessToken, newSheetId, localDb);

    return newSheetId;
  } catch (error) {
    console.error('Error finding/creating spreadsheet:', error);
    throw error;
  }
};

// Push all database sheets to Google Sheets
export const pushFullDataToSheets = async (accessToken: string, spreadsheetId: string, db: AppDatabase): Promise<void> => {
  const keys: (keyof AppDatabase)[] = [
    'pengguna', 'siswa', 'jadwal', 'absen', 'jurnal', 
    'tugas', 'nilai', 'bimbingan', 'piket', 'refleksi', 'inventaris'
  ];

  const dataPayload = keys.map(key => {
    const rangeName = key.charAt(0).toUpperCase() + key.slice(1);
    return {
      range: `${rangeName}!A1:Z1000`, // Clear and write up to 1000 rows
      values: serializeRows(key, db[key])
    };
  });

  // Since Google API requires clear range first or overwriting, we can overwrite.
  // First, let's execute clear ranges
  for (const key of keys) {
    const rangeName = key.charAt(0).toUpperCase() + key.slice(1);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeName}!A1:Z1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }

  // Then do a batch update to insert new values
  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataPayload
    })
  });

  if (!batchRes.ok) {
    throw new Error('Gagal melakukan sinkronisasi data ke Google Sheets.');
  }
};

// Pull all database sheets from Google Sheets to local cache
export const pullFullDataFromSheets = async (accessToken: string, spreadsheetId: string): Promise<AppDatabase> => {
  const keys: (keyof AppDatabase)[] = [
    'pengguna', 'siswa', 'jadwal', 'absen', 'jurnal', 
    'tugas', 'nilai', 'bimbingan', 'piket', 'refleksi', 'inventaris'
  ];

  const ranges = keys.map(key => key.charAt(0).toUpperCase() + key.slice(1) + '!A1:Z1000').join('&ranges=');
  const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!getRes.ok) {
    throw new Error('Gagal mengunduh data dari Google Sheets.');
  }

  const resData = await getRes.json();
  const db: Partial<AppDatabase> = {};

  keys.forEach((key, index) => {
    const valueRange = resData.valueRanges[index];
    const rows = valueRange?.values || [];
    db[key] = deserializeRows(key, rows);
  });

  // Update localStorage
  saveFullLocalData(db as AppDatabase);

  return db as AppDatabase;
};

// Single table push (efficient updating)
export const pushTableToSheets = async (accessToken: string, spreadsheetId: string, key: keyof AppDatabase, items: any[]): Promise<void> => {
  const rangeName = key.charAt(0).toUpperCase() + key.slice(1);

  // Clear range first
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeName}!A1:Z1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new rows
  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeName}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      values: serializeRows(key, items)
    })
  });

  if (!writeRes.ok) {
    console.error(`Gagal memperbarui tabel ${rangeName} ke Google Sheets.`);
  }
};
