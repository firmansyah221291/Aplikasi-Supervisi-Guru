import React, { useState } from 'react';
import { 
  AppDatabase, 
  Pengguna, 
  Siswa, 
  JurnalMengajar, 
  AbsenSiswa, 
  NilaiSiswa, 
  UserRole,
  InventarisKelas,
  BimbinganSiswa
} from '../types';
import { 
  BookOpen, Users, ClipboardList, Clock, GraduationCap, 
  Settings, LogOut, RefreshCw, CheckCircle, Search, 
  Plus, Edit2, Trash2, KeyRound, Save, Filter, ShieldCheck,
  Building, LayoutGrid, Inbox, MessageSquare, Phone, ShieldAlert, Eye
} from 'lucide-react';
import { pushTableToSheets } from '../lib/googleSheets';

interface DashboardKepalaSekolahProps {
  user: any;
  accessToken: string;
  profile: Pengguna;
  spreadsheetId: string | null;
  database: AppDatabase;
  onUpdateDatabase: (updatedDb: AppDatabase) => void;
  onLogout: () => void;
  onForceSync: () => Promise<void>;
  syncing: boolean;
}

export default function DashboardKepalaSekolah({
  user,
  accessToken,
  profile,
  spreadsheetId,
  database,
  onUpdateDatabase,
  onLogout,
  onForceSync,
  syncing
}: DashboardKepalaSekolahProps) {
  const [activeTab, setActiveTab] = useState<string>('ringkasan');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('Semua');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');

  // Modals / Form States for managing Users/Pengguna
  const [editId, setEditId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    email: '', nama: '', peran: 'Guru Kelas 1' as UserRole, noHp: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to save database changes
  const handleSaveData = async (key: keyof AppDatabase, items: any[], successMsg: string) => {
    const updatedDb = { ...database, [key]: items };
    onUpdateDatabase(updatedDb);
    showNotification('success', successMsg + ' (Local)');

    if (spreadsheetId && accessToken) {
      try {
        await pushTableToSheets(accessToken, spreadsheetId, key, items);
        showNotification('success', successMsg + ' & Sinkron ke Google Sheets!');
      } catch (err) {
        showNotification('error', 'Gagal sinkronisasi otomatis ke Google Sheets.');
      }
    }
  };

  // USER MANAGEMENT: Add / Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email.trim() || !userForm.nama.trim()) return;

    let updatedList = [...database.pengguna];
    if (editId) {
      updatedList = updatedList.map(p => p.email === editId ? { ...p, ...userForm } : p);
      setEditId(null);
    } else {
      // Check if duplicate email
      if (updatedList.some(p => p.email.toLowerCase() === userForm.email.toLowerCase())) {
        alert('Email sudah terdaftar!');
        return;
      }
      updatedList.push({ ...userForm });
    }

    await handleSaveData('pengguna', updatedList, 'Profil pengguna berhasil disimpan');
    setUserForm({ email: '', nama: '', peran: 'Guru Kelas 1', noHp: '' });
  };

  const handleEditUser = (p: Pengguna) => {
    setEditId(p.email);
    setUserForm({ email: p.email, nama: p.nama, peran: p.peran, noHp: p.noHp });
  };

  const handleDeleteUser = async (email: string) => {
    if (email === profile.email) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin mencabut hak akses guru ini?')) return;
    const updatedList = database.pengguna.filter(p => p.email !== email);
    await handleSaveData('pengguna', updatedList, 'Akses guru berhasil dicabut');
  };

  // STATISTICS CALCULATIONS
  const totalGuru = database.pengguna.length;
  const totalSiswa = database.siswa.length;
  const totalJurnal = database.jurnal.length;
  const totalInventaris = database.inventaris.length;

  // Gaya Belajar distribution
  const gayaVisual = database.siswa.filter(s => s.gayaBelajar === 'Visual').length;
  const gayaAuditori = database.siswa.filter(s => s.gayaBelajar === 'Auditori').length;
  const gayaKinestetik = database.siswa.filter(s => s.gayaBelajar === 'Kinestetik').length;
  const gayaCampuran = database.siswa.filter(s => s.gayaBelajar === 'Campuran').length;
  const gayaUnidentified = database.siswa.filter(s => s.gayaBelajar === 'Belum Diidentifikasi').length;

  // Attendance stats for today or last logged date
  const latestAbsenDate = database.absen.length > 0 
    ? database.absen.reduce((max, a) => a.tanggal > max ? a.tanggal : max, database.absen[0].tanggal) 
    : '-';
  const todayAbsen = database.absen.filter(a => a.tanggal === latestAbsenDate);
  const totalPresent = todayAbsen.filter(a => a.status === 'Hadir').length;
  const totalAbsent = todayAbsen.filter(a => a.status === 'Alpa' || a.status === 'Izin' || a.status === 'Sakit').length;
  const attendanceRate = todayAbsen.length > 0 
    ? Math.round((totalPresent / todayAbsen.length) * 100) 
    : 100;

  return (
    <div className="min-h-screen flex font-sans">
      {/* Sidebar - Hidden on print */}
      <aside className="w-64 bg-white/65 backdrop-blur-xl border-r border-white/40 flex-shrink-0 flex flex-col shadow-xl">
        <div className="p-5 border-b border-indigo-100/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 border border-white/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="font-display font-black text-indigo-900 text-sm leading-tight">Supervisi SD</h1>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Admin & KS</span>
            </div>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="p-4 mx-4 my-3 bg-white/50 backdrop-blur-md rounded-xl border border-white/50 shadow-xs">
          <div className="text-sm font-bold text-indigo-950 truncate">{profile.nama}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5 font-semibold flex items-center gap-1">
            <span>{profile.peran}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-mono truncate">{profile.email}</div>
        </div>

        {/* Navigation Tab list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ringkasan' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <LayoutGrid size={18} />
            <span>Dashboard Ringkasan</span>
          </button>

          <button
            onClick={() => setActiveTab('guru')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'guru' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <Users size={18} />
            <span>Kelola Guru & Akun</span>
          </button>

          <button
            onClick={() => setActiveTab('siswa')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'siswa' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <Users size={18} />
            <span>Supervisi Data Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'jurnal' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <ClipboardList size={18} />
            <span>Jurnal Mengajar Guru</span>
          </button>

          <button
            onClick={() => setActiveTab('bimbingan')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'bimbingan' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <MessageSquare size={18} />
            <span>Log Bimbingan Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('inventaris')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'inventaris' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <Inbox size={18} />
            <span>Aset & Inventaris SD</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'pengaturan' ? 'bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 shadow-xs' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-950'
            }`}
          >
            <Settings size={18} />
            <span>Pengaturan & Sync</span>
          </button>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200/50 space-y-2">
          <button
            onClick={onForceSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Mengsinkronkan...' : 'Refresh Sheets'}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-red-50 hover:text-white text-slate-600 border border-slate-200/40 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Top Header */}
        <header className="bg-white/40 backdrop-blur-md border-b border-white/40 h-16 px-6 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-indigo-900 capitalize">
            Sistem Supervisi Kepala Sekolah
          </h2>

          <div className="flex items-center gap-3">
            {spreadsheetId ? (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-white/60 border border-white/60 rounded-xl hover:bg-white/90 transition-all shadow-xs"
              >
                <CheckCircle className="text-emerald-500" size={14} />
                <span>Buka Spreadsheet DB</span>
              </a>
            ) : (
              <span className="text-xs text-amber-800 font-bold bg-amber-50/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-200/40">
                Sandbox Mode (Lokal)
              </span>
            )}
          </div>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 max-w-sm ${
              notification.type === 'success' 
                ? 'bg-emerald-50/85 backdrop-blur-md text-emerald-800 border-emerald-200/40 shadow-emerald-500/5' 
                : 'bg-red-50/85 backdrop-blur-md text-red-800 border-red-200/40 shadow-red-500/5'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert className="text-red-500" size={18} />}
              <span className="text-sm font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: RINGKASAN DASHBOARD */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-6">
              {/* Bento Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Guru Kelas & Mapel</span>
                    <h3 className="text-2xl font-display font-black text-indigo-900 mt-1">{totalGuru} Guru</h3>
                  </div>
                  <div className="h-12 w-12 bg-indigo-50/60 border border-indigo-100/30 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Users size={22} />
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Siswa Terdaftar</span>
                    <h3 className="text-2xl font-display font-black text-indigo-900 mt-1">{totalSiswa} Murid</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-50/60 border border-blue-100/30 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users size={22} />
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Jurnal Mengajar Terlog</span>
                    <h3 className="text-2xl font-display font-black text-indigo-900 mt-1">{totalJurnal} Jurnal</h3>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50/60 border border-emerald-100/30 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ClipboardList size={22} />
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kehadiran ({latestAbsenDate})</span>
                    <h3 className="text-2xl font-display font-black text-indigo-900 mt-1">{attendanceRate}% Rate</h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-50/60 border border-amber-100/30 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock size={22} />
                  </div>
                </div>
              </div>

              {/* Learning Style and Activity Logs Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gaya Belajar Chart Summary */}
                <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-indigo-950 text-sm border-b border-indigo-150/10 pb-3 mb-4">
                      Profil Gaya Belajar Murid (Sekolah)
                    </h3>
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Visual (Modul, Gambar, Warna)</span>
                          <span>{gayaVisual} Siswa</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(gayaVisual / (totalSiswa || 1)) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Auditori (Ceramah, Diskusi, Suara)</span>
                          <span>{gayaAuditori} Siswa</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(gayaAuditori / (totalSiswa || 1)) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Kinestetik (Fisik, Gerak, Praktik)</span>
                          <span>{gayaKinestetik} Siswa</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(gayaKinestetik / (totalSiswa || 1)) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Campuran (Multimodal)</span>
                          <span>{gayaCampuran} Siswa</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(gayaCampuran / (totalSiswa || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-4 text-center border-t border-slate-50 pt-3">
                    Profil gaya belajar dipetakan oleh Wali Kelas masing-masing.
                  </div>
                </div>

                {/* Live Activity Jurnal Mengajar Timeline */}
                <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm lg:col-span-2">
                  <h3 className="font-display font-bold text-indigo-950 text-sm border-b border-indigo-150/10 pb-3 mb-4 flex justify-between items-center">
                    <span>Aktivitas Pembelajaran Terakhir (Supervisi Live)</span>
                    <span className="text-[10px] bg-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Verifikasi KS</span>
                  </h3>

                  {database.jurnal.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <ClipboardList size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-medium">Belum ada jurnal mengajar guru yang terlog.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                      {database.jurnal
                        .sort((a,b) => b.tanggal.localeCompare(a.tanggal))
                        .slice(0, 5)
                        .map(j => (
                          <div key={j.id} className="border-l-2 border-indigo-500 pl-4 py-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-indigo-800 bg-indigo-100/60 px-2 py-0.5 rounded-lg border border-indigo-200/40">Kls {j.kelas}</span>
                              <span className="text-[10px] text-slate-500 font-mono font-semibold">{j.tanggal}</span>
                              <span className="text-[10px] text-indigo-650 font-semibold">Oleh: {j.guruNama}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs">{j.materi} (Mapel: {j.mataPelajaran})</h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2"><span className="font-semibold text-slate-700">Kegiatan:</span> {j.kegiatan}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA GURU & AKUN */}
          {activeTab === 'guru' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add/Edit User Profile */}
              <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm h-fit">
                <h3 className="font-display font-bold text-indigo-950 text-sm border-b border-indigo-100/20 pb-3 mb-4">
                  {editId ? 'Edit Akses Guru' : 'Daftarkan Guru Baru'}
                </h3>
                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Gmail Aktif Guru</label>
                    <input
                      type="email"
                      required
                      disabled={!!editId}
                      value={userForm.email}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="guru@gmail.com atau @guru.sd.belajar.id"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={userForm.nama}
                      onChange={e => setUserForm({ ...userForm, nama: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Siti Aminah, S.Pd."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tugas / Peran</label>
                    <select
                      value={userForm.peran}
                      onChange={e => setUserForm({ ...userForm, peran: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    >
                      <option value="Kepala Sekolah">Kepala Sekolah</option>
                      <option value="Admin">Admin</option>
                      <option value="Guru Kelas 1">Guru Kelas 1</option>
                      <option value="Guru Kelas 2">Guru Kelas 2</option>
                      <option value="Guru Kelas 3">Guru Kelas 3</option>
                      <option value="Guru Kelas 4">Guru Kelas 4</option>
                      <option value="Guru Kelas 5">Guru Kelas 5</option>
                      <option value="Guru Kelas 6">Guru Kelas 6</option>
                      <option value="Guru Mapel PAI">Guru Mapel PAI (Agama)</option>
                      <option value="Guru Mapel PJOK">Guru Mapel PJOK (Olahraga)</option>
                      <option value="Guru Mapel Bahasa Inggris">Guru Mapel Bahasa Inggris</option>
                      <option value="Guru Mapel BTQ">Guru Mapel BTQ</option>
                      <option value="Guru Mapel Mulok Bahasa Madura">Guru Mapel Mulok B. Madura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">No. WhatsApp</label>
                    <input
                      type="text"
                      value={userForm.noHp}
                      onChange={e => setUserForm({ ...userForm, noHp: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="08123456789"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>{editId ? 'Perbarui Akses' : 'Simpan Akun'}</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setUserForm({ email: '', nama: '', peran: 'Guru Kelas 1', noHp: '' });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Users list table */}
              <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-indigo-100/20">
                  <h3 className="font-display font-bold text-indigo-950 text-sm">Akun Terdaftar ({database.pengguna.length} Pengguna)</h3>
                  <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari guru..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-slate-50/50 uppercase">
                        <th className="py-3 px-3">Nama Lengkap</th>
                        <th className="py-3 px-3">Jabatan / Kelas</th>
                        <th className="py-3 px-3">Email Pengguna</th>
                        <th className="py-3 px-3 text-center">WA</th>
                        <th className="py-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {database.pengguna
                        .filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => (
                          <tr key={p.email} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-850">{p.nama}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                p.peran === 'Kepala Sekolah' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                p.peran === 'Admin' ? 'bg-slate-100 border-slate-200 text-slate-700' :
                                p.peran.includes('Mapel') ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                'bg-blue-50 border-blue-100 text-blue-700'
                              }`}>
                                {p.peran}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-slate-500">{p.email}</td>
                            <td className="py-3 px-3 text-center text-xs text-slate-600">
                              {p.noHp && p.noHp !== '-' ? (
                                <a href={`https://wa.me/${p.noHp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center justify-center gap-1">
                                  <Phone size={12} /> Yes
                                </a>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => handleEditUser(p)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(p.email)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATA SISWA SUPERVISI */}
          {activeTab === 'siswa' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/20 pb-4 mb-4">
                <div>
                  <h3 className="font-display font-bold text-indigo-950 text-sm">Data Gaya Belajar & Profil Siswa SD</h3>
                  <p className="text-xs text-slate-500">Melihat pemetaan gaya belajar siswa untuk menyesuaikan metode ajar sekolah</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 font-semibold">Filter Kelas:</span>
                  <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="Semua">Semua Kelas (1-6)</option>
                    {['1', '2', '3', '4', '5', '6'].map(kls => (
                      <option key={kls} value={kls}>Kelas {kls}</option>
                    ))}
                  </select>
                </div>
              </div>

              {database.siswa.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Belum ada siswa terdaftar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50">
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-3">Nama Siswa</th>
                        <th className="py-3 px-3">NISN</th>
                        <th className="py-3 px-3 text-center">JK</th>
                        <th className="py-3 px-3">Gaya Belajar</th>
                        <th className="py-3 px-3">Catatan Khusus Wali Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {database.siswa
                        .filter(s => classFilter === 'Semua' || s.kelas === classFilter)
                        .map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/20">
                            <td className="py-3 px-3 font-bold text-indigo-600">Kls {s.kelas}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{s.nama}</td>
                            <td className="py-3 px-3 font-mono text-xs text-slate-500">{s.nisn || '-'}</td>
                            <td className="py-3 px-3 text-center text-xs font-bold text-slate-600">{s.jenisKelamin}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                s.gayaBelajar === 'Visual' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                s.gayaBelajar === 'Auditori' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                s.gayaBelajar === 'Kinestetik' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                s.gayaBelajar === 'Campuran' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                'bg-slate-50 border-slate-200 text-slate-500'
                              }`}>
                                {s.gayaBelajar}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-500">{s.catatan || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: JURNAL MENGAJAR GURU */}
          {activeTab === 'jurnal' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/20 pb-4 mb-5">
                <div>
                  <h3 className="font-display font-bold text-indigo-950 text-sm">Supervisi Pembelajaran (Jurnal Mengajar Guru)</h3>
                  <p className="text-xs text-slate-500">Memantau materi, langkah pengajaran, kendala dan solusi yang dilaporkan guru kelas & mapel</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 font-semibold">Filter Kelas:</span>
                  <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {['1', '2', '3', '4', '5', '6'].map(kls => (
                      <option key={kls} value={kls}>Kelas {kls}</option>
                    ))}
                  </select>
                </div>
              </div>

              {database.jurnal.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ClipboardList size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Belum ada guru yang mengisi jurnal mengajar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {database.jurnal
                    .filter(j => classFilter === 'Semua' || j.kelas === classFilter)
                    .sort((a,b) => b.tanggal.localeCompare(a.tanggal))
                    .map(j => (
                      <div key={j.id} className="border border-white/40 rounded-xl p-4 bg-white/40 backdrop-blur-xs space-y-2.5 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/20 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{j.mataPelajaran}</span>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Kls {j.kelas}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">{j.tanggal}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">Wali/Guru: {j.guruNama}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{j.materi}</h4>
                        <p className="text-xs text-slate-600"><span className="font-semibold text-slate-700">Kegiatan Mengajar:</span> {j.kegiatan}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100/50">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/40">
                            <strong className="text-emerald-700 block mb-0.5">Hasil Refleksi Pembelajaran:</strong>
                            <p className="text-slate-600 italic">"{j.refleksi}"</p>
                          </div>
                          {j.hambatan && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/40">
                              <strong className="text-amber-700 block mb-0.5">Hambatan & Tindak Lanjut Guru:</strong>
                              <p className="text-slate-600 italic">"{j.hambatan}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LOG BIMBINGAN SISWA */}
          {activeTab === 'bimbingan' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm">
              <h3 className="font-display font-bold text-indigo-950 text-sm pb-3 border-b border-indigo-100/20 mb-4">
                Laporan & Riwayat Konseling Siswa (Intervensi Dini)
              </h3>

              {database.bimbingan.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <MessageSquare size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Belum ada laporan bimbingan siswa yang dilaporkan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {database.bimbingan
                    .sort((a,b) => b.tanggal.localeCompare(a.tanggal))
                    .map(b => (
                      <div key={b.id} className="border border-white/40 rounded-xl p-4 bg-white/40 backdrop-blur-xs space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-indigo-100/20 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 border border-red-100 rounded-lg">{b.namaSiswa}</span>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-100 rounded-lg">Kelas {b.kelas}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">{b.tanggal}</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1.5">
                          <div><strong>Uraian Gejala / Masalah:</strong> {b.masalah}</div>
                          <div><strong>Hasil Penanganan / Konseling Guru:</strong> {b.solusi}</div>
                          <div><strong>Rencana Tindak Lanjut:</strong> {b.tindakLanjut}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INVENTARIS SEKOLAH */}
          {activeTab === 'inventaris' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/20 pb-4 mb-4">
                <div>
                  <h3 className="font-display font-bold text-indigo-950 text-sm">Supervisi Sarana & Prasarana Kelas</h3>
                  <p className="text-xs text-slate-500">Memeriksa kondisi kelayakan dan ketersediaan fasilitas belajar siswa di tiap kelas</p>
                </div>
              </div>

              {database.inventaris.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Inbox size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Belum ada laporan inventaris kelas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50">
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-3">Nama Barang</th>
                        <th className="py-3 px-3 text-center">Jumlah</th>
                        <th className="py-3 px-3">Kondisi Kelayakan</th>
                        <th className="py-3 px-3">Sumber Dana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {database.inventaris
                        .sort((a,b) => a.kelas.localeCompare(b.kelas))
                        .map(i => (
                          <tr key={i.id} className="hover:bg-slate-50/20">
                            <td className="py-3 px-3 font-bold text-indigo-650">Kelas {i.kelas}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{i.namaBarang}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700">{i.jumlah}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                i.kondisi === 'Baik' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                i.kondisi === 'Rusak Ringan' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                'bg-red-50 border-red-100 text-red-700'
                              }`}>
                                {i.kondisi}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-500">{i.sumber}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SETTINGS / SINKRONISASI */}
          {activeTab === 'pengaturan' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="font-display font-bold text-indigo-950 text-sm">Integrasi Sistem Google Sheets</h3>
                <p className="text-xs text-slate-500">Atur database utama sekolah agar terhubung secara instan dan realtime ke Google Drive/Sheets admin.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-indigo-800 uppercase">Status Lisensi</h4>
                  <div className="text-xs text-indigo-900 space-y-1">
                    <div><strong>Kepala Sekolah:</strong> {profile.nama}</div>
                    <div><strong>Surel Pengawas:</strong> {profile.email}</div>
                    <div><strong>Akses:</strong> Admin & Supervisor Sekolah</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Spreadsheet ID Utama</label>
                  {spreadsheetId ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        disabled
                        value={spreadsheetId}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 text-slate-500"
                      />
                      <p className="text-[10px] text-slate-400">Guru-guru akan menyinkronkan jurnal, gaya belajar, absen, dan nilai mereka ke Spreadsheet ini.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={onForceSync}
                          disabled={syncing}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                          <span>Sinkronisasikan Sekarang</span>
                        </button>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Eye size={14} />
                          <span>Buka Google Sheets</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-slate-50/50">
                      <p className="text-xs text-slate-500">Belum terhubung ke Google Spreadsheet.</p>
                      <button
                        onClick={onForceSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                        <span>Inisialisasi Spreadsheet</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Keluar Akun Google</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
