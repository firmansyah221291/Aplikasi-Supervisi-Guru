export type UserRole =
  | 'Kepala Sekolah'
  | 'Admin'
  | 'Guru Kelas 1'
  | 'Guru Kelas 2'
  | 'Guru Kelas 3'
  | 'Guru Kelas 4'
  | 'Guru Kelas 5'
  | 'Guru Kelas 6'
  | 'Guru Mapel PAI'
  | 'Guru Mapel PJOK'
  | 'Guru Mapel Bahasa Inggris'
  | 'Guru Mapel BTQ'
  | 'Guru Mapel Mulok Bahasa Madura';

export interface Pengguna {
  email: string;
  nama: string;
  peran: UserRole;
  noHp: string;
}

export interface Siswa {
  id: string;
  kelas: string; // '1' | '2' | '3' | '4' | '5' | '6'
  nama: string;
  nisn: string;
  jenisKelamin: 'L' | 'P';
  gayaBelajar: 'Visual' | 'Auditori' | 'Kinestetik' | 'Campuran' | 'Belum Diidentifikasi';
  catatan: string;
}

export interface JadwalPelajaran {
  id: string;
  kelas: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamKe: string; // e.g. "07:00 - 08:30"
  mataPelajaran: string;
  guru: string;
}

export interface AbsenSiswa {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kelas: string;
  siswaId: string;
  namaSiswa: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  keterangan: string;
}

export interface JurnalMengajar {
  id: string;
  tanggal: string; // YYYY-MM-DD
  guruEmail: string;
  guruNama: string;
  kelas: string;
  mataPelajaran: string;
  materi: string;
  kegiatan: string;
  refleksi: string;
  hambatan: string;
}

export interface TugasSiswa {
  id: string;
  kelas: string;
  mataPelajaran: string;
  judulTugas: string;
  deskripsi: string;
  tanggalBatas: string; // YYYY-MM-DD
}

export interface NilaiSiswa {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  mataPelajaran: string;
  jenisNilai: 'Tugas' | 'Ulangan Harian' | 'UTS' | 'UAS';
  nilai: number;
}

export interface BimbinganSiswa {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kelas: string;
  siswaId: string;
  namaSiswa: string;
  masalah: string;
  solusi: string;
  tindakLanjut: string;
}

export interface PiketKelas {
  id: string;
  kelas: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  namaSiswa: string; // comma-separated names or single name
}

export interface RefleksiGuru {
  id: string;
  tanggal: string; // YYYY-MM-DD
  guruEmail: string;
  guruNama: string;
  kelas: string;
  refleksiDiri: string;
  rencanaTindakLanjut: string;
  kalimatMotivasi: string;
}

export interface InventarisKelas {
  id: string;
  kelas: string;
  namaBarang: string;
  jumlah: number;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  sumber: string; // e.g. "BOS", "Iuran"
}

export interface AppDatabase {
  pengguna: Pengguna[];
  siswa: Siswa[];
  jadwal: JadwalPelajaran[];
  absen: AbsenSiswa[];
  jurnal: JurnalMengajar[];
  tugas: TugasSiswa[];
  nilai: NilaiSiswa[];
  bimbingan: BimbinganSiswa[];
  piket: PiketKelas[];
  refleksi: RefleksiGuru[];
  inventaris: InventarisKelas[];
}
