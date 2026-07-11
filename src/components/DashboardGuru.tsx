import React, { useState, useEffect } from 'react';
import { 
  AppDatabase, 
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
  Pengguna,
  UserRole
} from '../types';
import { 
  Users, BookOpen, Calendar, Clock, ClipboardList, BookMarked, 
  GraduationCap, MessageSquare, Flame, Trash2, Edit2, Plus, 
  Save, Printer, Settings, RefreshCw, LogOut, CheckCircle, 
  Search, ShieldAlert, Award, Inbox, Eye
} from 'lucide-react';
import { pushTableToSheets } from '../lib/googleSheets';

interface DashboardGuruProps {
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

export default function DashboardGuru({
  user,
  accessToken,
  profile,
  spreadsheetId,
  database,
  onUpdateDatabase,
  onLogout,
  onForceSync,
  syncing
}: DashboardGuruProps) {
  // Determine if user is Class Teacher or Subject Teacher
  const isMapel = profile.peran.startsWith('Guru Mapel');
  const classTeacherClass = !isMapel ? profile.peran.replace('Guru Kelas ', '') : '1'; 
  
  // For Mapel teachers, they can switch between Class 1-6
  const [selectedClass, setSelectedClass] = useState<string>(classTeacherClass);
  
  // List of subjects taught by this teacher
  const mapelName = isMapel ? profile.peran.replace('Guru Mapel ', '') : 'Tematik / Semua';

  // State of Active Tab
  const [activeTab, setActiveTab] = useState<string>('siswa');

  // Search, edit and modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  // Student Form
  const [studentForm, setStudentForm] = useState({
    nama: '', nisn: '', jenisKelamin: 'L' as 'L' | 'P',
    gayaBelajar: 'Belum Diidentifikasi' as any, catatan: ''
  });

  // Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    hari: 'Senin' as any, jamKe: '07:00 - 08:30', mataPelajaran: isMapel ? mapelName : 'Tematik', guru: profile.nama
  });

  // Attendance Form (Selected Date)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: any, keterangan: string }>>({});

  // Teaching Journal Form
  const [journalForm, setJournalForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    mataPelajaran: isMapel ? mapelName : 'Tematik',
    materi: '', kegiatan: '', refleksi: '', hambatan: ''
  });

  // Assignment Form
  const [assignmentForm, setAssignmentForm] = useState({
    mataPelajaran: isMapel ? mapelName : 'Tematik',
    judulTugas: '', deskripsi: '', tanggalBatas: new Date().toISOString().split('T')[0]
  });

  // Student Grades Form (Siswa ID map to score)
  const [gradeSubject, setGradeSubject] = useState(isMapel ? mapelName : 'Tematik');
  const [gradeType, setGradeType] = useState<'Tugas' | 'Ulangan Harian' | 'UTS' | 'UAS'>('Tugas');
  const [gradeScores, setGradeScores] = useState<Record<string, number>>({});

  // Guidance/Bimbingan Form
  const [bimbinganForm, setBimbinganForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: '', masalah: '', solusi: '', tindakLanjut: ''
  });

  // Picket Form
  const [piketForm, setPiketForm] = useState({
    hari: 'Senin' as any, namaSiswa: ''
  });

  // Reflection/Motivation Form
  const [reflectionForm, setReflectionForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    refleksiDiri: '', rencanaTindakLanjut: '', kalimatMotivasi: ''
  });

  // Inventory Form
  const [inventoryForm, setInventoryForm] = useState({
    namaBarang: '', jumlah: 1, kondisi: 'Baik' as 'Baik' | 'Rusak Ringan' | 'Rusak Berat', sumber: 'BOS'
  });

  // Notification states
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter students based on selected class
  const classStudents = database.siswa.filter(s => s.kelas === selectedClass);

  // Initialize Attendance Records for the date and class
  useEffect(() => {
    const existingAbsen = database.absen.filter(a => a.kelas === selectedClass && a.tanggal === attendanceDate);
    const initialRecords: Record<string, { status: any, keterangan: string }> = {};
    
    classStudents.forEach(siswa => {
      const found = existingAbsen.find(a => a.siswaId === siswa.id);
      initialRecords[siswa.id] = {
        status: found ? found.status : 'Hadir',
        keterangan: found ? found.keterangan : ''
      };
    });
    setAttendanceRecords(initialRecords);
  }, [selectedClass, attendanceDate, database.absen]);

  // Initialize Grades scores
  useEffect(() => {
    const scores: Record<string, number> = {};
    classStudents.forEach(siswa => {
      const found = database.nilai.find(n => 
        n.siswaId === siswa.id && 
        n.kelas === selectedClass && 
        n.mataPelajaran === gradeSubject && 
        n.jenisNilai === gradeType
      );
      scores[siswa.id] = found ? found.nilai : 0;
    });
    setGradeScores(scores);
  }, [selectedClass, gradeSubject, gradeType, database.nilai]);

  // Generic Save Helper to update state and trigger Sheets sync
  const handleSaveData = async (key: keyof AppDatabase, items: any[], successMsg: string) => {
    const updatedDb = { ...database, [key]: items };
    onUpdateDatabase(updatedDb);
    showNotification('success', successMsg + ' (Local)');

    if (spreadsheetId && accessToken) {
      try {
        await pushTableToSheets(accessToken, spreadsheetId, key, items);
        showNotification('success', successMsg + ' & Tersinkronisasi ke Google Sheets!');
      } catch (err) {
        showNotification('error', 'Gagal sinkronisasi otomatis ke Google Sheets. Silakan sinkronkan manual.');
      }
    }
  };

  // MENU 1: DATA SISWA
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nama.trim()) return;

    let updatedList = [...database.siswa];
    if (editId) {
      updatedList = updatedList.map(s => s.id === editId ? { ...s, ...studentForm } : s);
      setEditId(null);
    } else {
      const newId = 'S' + selectedClass + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        kelas: selectedClass,
        ...studentForm
      });
    }

    await handleSaveData('siswa', updatedList, 'Data Siswa berhasil disimpan');
    setStudentForm({ nama: '', nisn: '', jenisKelamin: 'L', gayaBelajar: 'Belum Diidentifikasi', catatan: '' });
  };

  const handleEditStudent = (s: Siswa) => {
    setEditId(s.id);
    setStudentForm({
      nama: s.nama, nisn: s.nisn, jenisKelamin: s.jenisKelamin,
      gayaBelajar: s.gayaBelajar, catatan: s.catatan
    });
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data siswa ini? Semua data nilai dan absen terkait siswa ini juga akan terpengaruh.')) return;
    const updatedList = database.siswa.filter(s => s.id !== id);
    await handleSaveData('siswa', updatedList, 'Data Siswa berhasil dihapus');
  };

  // MENU 2: JADWAL PELAJARAN
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...database.jadwal];
    if (editId) {
      updatedList = updatedList.map(j => j.id === editId ? { ...j, ...scheduleForm } : j);
      setEditId(null);
    } else {
      const newId = 'J' + selectedClass + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        kelas: selectedClass,
        ...scheduleForm
      });
    }
    await handleSaveData('jadwal', updatedList, 'Jadwal pelajaran berhasil disimpan');
    setScheduleForm({ hari: 'Senin', jamKe: '07:00 - 08:30', mataPelajaran: isMapel ? mapelName : 'Tematik', guru: profile.nama });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Hapus jadwal pelajaran ini?')) return;
    const updatedList = database.jadwal.filter(j => j.id !== id);
    await handleSaveData('jadwal', updatedList, 'Jadwal pelajaran berhasil dihapus');
  };

  // MENU 4: ABSEN SISWA
  const handleSaveAttendance = async () => {
    let updatedList = [...database.absen];
    
    // Clear old records of this class and date
    updatedList = updatedList.filter(a => !(a.kelas === selectedClass && a.tanggal === attendanceDate));

    // Append new records
    classStudents.forEach(siswa => {
      const record = attendanceRecords[siswa.id] || { status: 'Hadir', keterangan: '' };
      updatedList.push({
        id: 'A' + selectedClass + siswa.id + attendanceDate.replace(/-/g, ''),
        tanggal: attendanceDate,
        kelas: selectedClass,
        siswaId: siswa.id,
        namaSiswa: siswa.nama,
        status: record.status,
        keterangan: record.keterangan
      });
    });

    await handleSaveData('absen', updatedList, 'Daftar Presensi berhasil disimpan');
  };

  // MENU 5: JURNAL MENGAJAR
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...database.jurnal];
    if (editId) {
      updatedList = updatedList.map(jr => jr.id === editId ? { ...jr, ...journalForm } : jr);
      setEditId(null);
    } else {
      const newId = 'JR' + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        guruEmail: profile.email,
        guruNama: profile.nama,
        kelas: selectedClass,
        ...journalForm
      });
    }
    await handleSaveData('jurnal', updatedList, 'Jurnal mengajar berhasil disimpan');
    setJournalForm({
      tanggal: new Date().toISOString().split('T')[0],
      mataPelajaran: isMapel ? mapelName : 'Tematik',
      materi: '', kegiatan: '', refleksi: '', hambatan: ''
    });
  };

  const handleDeleteJournal = async (id: string) => {
    if (!window.confirm('Hapus jurnal mengajar ini?')) return;
    const updatedList = database.jurnal.filter(jr => jr.id !== id);
    await handleSaveData('jurnal', updatedList, 'Jurnal mengajar berhasil dihapus');
  };

  // MENU 6: TUGAS SISWA
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...database.tugas];
    if (editId) {
      updatedList = updatedList.map(t => t.id === editId ? { ...t, ...assignmentForm } : t);
      setEditId(null);
    } else {
      const newId = 'T' + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        kelas: selectedClass,
        ...assignmentForm
      });
    }
    await handleSaveData('tugas', updatedList, 'Tugas siswa berhasil disimpan');
    setAssignmentForm({
      mataPelajaran: isMapel ? mapelName : 'Tematik',
      judulTugas: '', deskripsi: '', tanggalBatas: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Hapus tugas siswa ini?')) return;
    const updatedList = database.tugas.filter(t => t.id !== id);
    await handleSaveData('tugas', updatedList, 'Tugas siswa berhasil dihapus');
  };

  // MENU 7: NILAI SISWA
  const handleSaveGrades = async () => {
    let updatedList = [...database.nilai];
    
    // Clear old grades of this filter
    updatedList = updatedList.filter(n => !(n.kelas === selectedClass && n.mataPelajaran === gradeSubject && n.jenisNilai === gradeType));

    // Append new grades
    classStudents.forEach(siswa => {
      const score = gradeScores[siswa.id] || 0;
      updatedList.push({
        id: 'N' + selectedClass + siswa.id + gradeSubject.slice(0,2).toUpperCase() + gradeType.slice(0,2).toUpperCase(),
        siswaId: siswa.id,
        namaSiswa: siswa.nama,
        kelas: selectedClass,
        mataPelajaran: gradeSubject,
        jenisNilai: gradeType,
        nilai: score
      });
    });

    await handleSaveData('nilai', updatedList, 'Daftar nilai berhasil disimpan');
  };

  // MENU 8: BIMBINGAN SISWA
  const handleSaveBimbingan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bimbinganForm.siswaId) {
      alert('Silakan pilih nama siswa terlebih dahulu.');
      return;
    }
    const siswaObj = database.siswa.find(s => s.id === bimbinganForm.siswaId);
    if (!siswaObj) return;

    let updatedList = [...database.bimbingan];
    if (editId) {
      updatedList = updatedList.map(b => b.id === editId ? { ...b, ...bimbinganForm, namaSiswa: siswaObj.nama } : b);
      setEditId(null);
    } else {
      const newId = 'B' + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        kelas: selectedClass,
        namaSiswa: siswaObj.nama,
        ...bimbinganForm
      });
    }
    await handleSaveData('bimbingan', updatedList, 'Catatan bimbingan berhasil disimpan');
    setBimbinganForm({
      tanggal: new Date().toISOString().split('T')[0],
      siswaId: '', masalah: '', solusi: '', tindakLanjut: ''
    });
  };

  const handleDeleteBimbingan = async (id: string) => {
    if (!window.confirm('Hapus catatan bimbingan ini?')) return;
    const updatedList = database.bimbingan.filter(b => b.id !== id);
    await handleSaveData('bimbingan', updatedList, 'Catatan bimbingan berhasil dihapus');
  };

  // MENU 9: JADWAL PIKET KELAS
  const handleSavePiket = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...database.piket];
    const existing = updatedList.find(p => p.kelas === selectedClass && p.hari === piketForm.hari);
    
    if (existing) {
      updatedList = updatedList.map(p => (p.kelas === selectedClass && p.hari === piketForm.hari) ? { ...p, namaSiswa: piketForm.namaSiswa } : p);
    } else {
      updatedList.push({
        id: 'P' + selectedClass + piketForm.hari.slice(0,3),
        kelas: selectedClass,
        hari: piketForm.hari,
        namaSiswa: piketForm.namaSiswa
      });
    }
    await handleSaveData('piket', updatedList, 'Jadwal piket berhasil diperbarui');
    setPiketForm({ hari: 'Senin', namaSiswa: '' });
  };

  // MENU 10: REFLEKSI DAN MOTIVASI
  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...database.refleksi];
    if (editId) {
      updatedList = updatedList.map(r => r.id === editId ? { ...r, ...reflectionForm } : r);
      setEditId(null);
    } else {
      const newId = 'R' + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        guruEmail: profile.email,
        guruNama: profile.nama,
        kelas: selectedClass,
        ...reflectionForm
      });
    }
    await handleSaveData('refleksi', updatedList, 'Catatan refleksi & motivasi berhasil disimpan');
    setReflectionForm({
      tanggal: new Date().toISOString().split('T')[0],
      refleksiDiri: '', rencanaTindakLanjut: '', kalimatMotivasi: ''
    });
  };

  const handleDeleteReflection = async (id: string) => {
    if (!window.confirm('Hapus catatan refleksi ini?')) return;
    const updatedList = database.refleksi.filter(r => r.id !== id);
    await handleSaveData('refleksi', updatedList, 'Catatan refleksi berhasil dihapus');
  };

  // MENU 11: INVENTARIS KELAS
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...database.inventaris];
    if (editId) {
      updatedList = updatedList.map(i => i.id === editId ? { ...i, ...inventoryForm } : i);
      setEditId(null);
    } else {
      const newId = 'I' + selectedClass + Date.now().toString().slice(-4);
      updatedList.push({
        id: newId,
        kelas: selectedClass,
        ...inventoryForm
      });
    }
    await handleSaveData('inventaris', updatedList, 'Barang inventaris berhasil disimpan');
    setInventoryForm({ namaBarang: '', jumlah: 1, kondisi: 'Baik', sumber: 'BOS' });
  };

  const handleDeleteInventory = async (id: string) => {
    if (!window.confirm('Hapus barang inventaris ini?')) return;
    const updatedList = database.inventaris.filter(i => i.id !== id);
    await handleSaveData('inventaris', updatedList, 'Barang inventaris berhasil dihapus');
  };

  return (
    <div className="min-h-screen bg-transparent flex font-sans print:bg-white print:text-black">
      {/* Sidebar - Hidden on print */}
      <aside className="w-64 bg-white/65 backdrop-blur-xl border-r border-white/40 flex-shrink-0 flex flex-col shadow-xl print:hidden">
        <div className="p-5 border-b border-indigo-100/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 border border-white/20">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="font-display font-black text-indigo-950 text-sm leading-tight">Supervisi SD</h1>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Wali & Mapel Hub</span>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 mx-4 my-3 bg-white/50 backdrop-blur-md rounded-xl border border-white/50 shadow-xs">
          <div className="text-sm font-bold text-indigo-950 truncate">{profile.nama}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5 font-semibold truncate">{profile.peran}</div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-mono truncate">{profile.email}</div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'siswa' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Users size={18} />
            <span>Data Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('jadwal')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'jadwal' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Calendar size={18} />
            <span>Jadwal Pelajaran</span>
          </button>

          <button
            onClick={() => setActiveTab('absen')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'absen' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Clock size={18} />
            <span>Absen Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'jurnal' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <ClipboardList size={18} />
            <span>Jurnal Mengajar</span>
          </button>

          <button
            onClick={() => setActiveTab('tugas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'tugas' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <BookMarked size={18} />
            <span>Tugas Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('nilai')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'nilai' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <GraduationCap size={18} />
            <span>Nilai Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('bimbingan')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'bimbingan' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <MessageSquare size={18} />
            <span>Catatan & Bimbingan</span>
          </button>

          <button
            onClick={() => setActiveTab('piket')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'piket' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Award size={18} />
            <span>Jadwal Piket Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('refleksi')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'refleksi' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Flame size={18} />
            <span>Refleksi & Motivasi</span>
          </button>

          <button
            onClick={() => setActiveTab('inventaris')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'inventaris' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Inbox size={18} />
            <span>Inventaris Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'rekap' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Printer size={18} />
            <span>Rekap & Cetak</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'pengaturan' ? 'bg-indigo-600/15 text-indigo-800 border border-indigo-200/50 shadow-2xs' : 'text-slate-600 hover:bg-white/40 hover:text-indigo-900'
            }`}
          >
            <Settings size={18} />
            <span>Pengaturan</span>
          </button>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-indigo-100/40 space-y-2">
          <button
            onClick={onForceSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Menyinkronkan...' : 'Sinkronisasi Sheets'}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200/60 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent print:bg-white">
        {/* Top Header - Hidden on print */}
        <header className="bg-white/60 backdrop-blur-md border-b border-white/40 h-16 px-6 flex items-center justify-between print:hidden shadow-xs">
          <div className="flex items-center gap-4">
            <h2 className="text-sm md:text-base font-display font-black text-indigo-950 capitalize">
              {activeTab === 'rekap' ? 'Rekap Data & Cetak Laporan' : `Aktivitas ${activeTab}`}
            </h2>

            {/* Class switcher for Mapel teachers OR status flag for class teachers */}
            {isMapel ? (
              <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-xs rounded-xl p-1 border border-indigo-100/30">
                <span className="text-[10px] text-indigo-900 font-bold px-2 uppercase tracking-wide">Kelas Pengampu:</span>
                {['1', '2', '3', '4', '5', '6'].map(kls => (
                  <button
                    key={kls}
                    onClick={() => setSelectedClass(kls)}
                    className={`px-2.5 py-1 text-[11px] font-black rounded-lg cursor-pointer transition-all ${
                      selectedClass === kls ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    Kls {kls}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-indigo-600/10 border border-indigo-200/50 text-indigo-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                Mengelola Kelas {selectedClass}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {spreadsheetId ? (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white/60 hover:bg-white/90 border border-white/80 rounded-xl transition-all shadow-2xs"
              >
                <CheckCircle className="text-emerald-500" size={14} />
                <span>Buka Google Sheets</span>
              </a>
            ) : (
              <span className="text-xs text-amber-700 font-bold bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200/50">
                Lokal Sandbox (Belum Sync)
              </span>
            )}
          </div>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 print:hidden animate-fade-in">
            <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 max-w-sm ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/5' 
                : 'bg-red-50 text-red-800 border-red-200 shadow-red-500/5'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
              <span className="text-sm font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: DATA SISWA */}
          {activeTab === 'siswa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add/Edit Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </h3>
                <form onSubmit={handleSaveStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={studentForm.nama}
                      onChange={e => setStudentForm({ ...studentForm, nama: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      placeholder="Nama Siswa"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">NISN</label>
                      <input
                        type="text"
                        value={studentForm.nisn}
                        onChange={e => setStudentForm({ ...studentForm, nisn: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="NISN"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jenis Kelamin</label>
                      <select
                        value={studentForm.jenisKelamin}
                        onChange={e => setStudentForm({ ...studentForm, jenisKelamin: e.target.value as any })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gaya Belajar Siswa</label>
                    <select
                      value={studentForm.gayaBelajar}
                      onChange={e => setStudentForm({ ...studentForm, gayaBelajar: e.target.value as any })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Belum Diidentifikasi">Belum Diidentifikasi</option>
                      <option value="Visual">Visual (Belajar via Gambar/Grafis)</option>
                      <option value="Auditori">Auditori (Belajar via Suara/Lisan)</option>
                      <option value="Kinestetik">Kinestetik (Belajar via Gerak/Praktik)</option>
                      <option value="Campuran">Campuran / Multimodal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Catatan Khusus</label>
                    <textarea
                      rows={3}
                      value={studentForm.catatan}
                      onChange={e => setStudentForm({ ...studentForm, catatan: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      placeholder="Misal: Perlu bimbingan ekstra matematika, aktif di pramuka, dll."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>{editId ? 'Perbarui' : 'Simpan'}</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setStudentForm({ nama: '', nisn: '', jenisKelamin: 'L', gayaBelajar: 'Belum Diidentifikasi', catatan: '' });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Students List Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <h3 className="font-display font-bold text-slate-800 text-sm">
                    Daftar Siswa Kelas {selectedClass} ({classStudents.length} Siswa)
                  </h3>
                  <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari siswa..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {classStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Users size={48} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-medium">Belum ada data siswa.</p>
                    <p className="text-xs">Silakan tambah siswa melalui form di sebelah kiri.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50">
                          <th className="py-3 px-3">NISN</th>
                          <th className="py-3 px-3">Nama</th>
                          <th className="py-3 px-3 text-center">JK</th>
                          <th className="py-3 px-3">Gaya Belajar</th>
                          <th className="py-3 px-3">Catatan</th>
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {classStudents
                          .filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery))
                          .map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3 font-mono text-xs text-slate-500">{s.nisn || '-'}</td>
                              <td className="py-3 px-3 font-semibold text-slate-800">{s.nama}</td>
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
                              <td className="py-3 px-3 text-xs text-slate-500 max-w-xs truncate">{s.catatan || '-'}</td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex gap-1.5">
                                  <button
                                    onClick={() => handleEditStudent(s)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(s.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: JADWAL PELAJARAN */}
          {activeTab === 'jadwal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Baru'}
                </h3>
                <form onSubmit={handleSaveSchedule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Hari</label>
                    <select
                      value={scheduleForm.hari}
                      onChange={e => setScheduleForm({ ...scheduleForm, hari: e.target.value as any })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    >
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => (
                        <option key={hari} value={hari}>{hari}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jam Pelajaran</label>
                    <input
                      type="text"
                      required
                      value={scheduleForm.jamKe}
                      onChange={e => setScheduleForm({ ...scheduleForm, jamKe: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      placeholder="Contoh: 07:00 - 08:30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                    {isMapel ? (
                      <input
                        type="text"
                        disabled
                        value={scheduleForm.mataPelajaran}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        value={scheduleForm.mataPelajaran}
                        onChange={e => setScheduleForm({ ...scheduleForm, mataPelajaran: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Contoh: IPA, Tematik, Matematika"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Guru Pengampu</label>
                    <input
                      type="text"
                      required
                      value={scheduleForm.guru}
                      onChange={e => setScheduleForm({ ...scheduleForm, guru: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>{editId ? 'Perbarui' : 'Simpan'}</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setScheduleForm({ hari: 'Senin', jamKe: '07:00 - 08:30', mataPelajaran: isMapel ? mapelName : 'Tematik', guru: profile.nama });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Jadwal Pelajaran Kelas {selectedClass}
                </h3>

                {database.jadwal.filter(j => j.kelas === selectedClass).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Calendar size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada jadwal pelajaran.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => {
                      const hariJadwal = database.jadwal.filter(j => j.kelas === selectedClass && j.hari === hari);
                      if (hariJadwal.length === 0) return null;

                      return (
                        <div key={hari} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                          <h4 className="font-bold text-slate-800 text-xs uppercase mb-2 text-blue-600 tracking-wide">{hari}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {hariJadwal.map(j => (
                              <div key={j.id} className="bg-white border border-slate-200/60 rounded-lg p-2.5 flex items-start justify-between shadow-2xs">
                                <div>
                                  <div className="font-semibold text-xs text-slate-800">{j.mataPelajaran}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                                    <Clock size={10} /> {j.jamKe}
                                  </div>
                                  <div className="text-[10px] text-slate-600 mt-0.5">Guru: {j.guru}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditId(j.id);
                                    setScheduleForm({ hari: j.hari, jamKe: j.jamKe, mataPelajaran: j.mataPelajaran, guru: j.guru });
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} onClick={() => handleDeleteSchedule(j.id)} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ABSEN SISWA */}
          {activeTab === 'absen' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Input & Edit Presensi Siswa</h3>
                  <p className="text-xs text-slate-500">Pilih tanggal dan kelola kehadiran seluruh siswa kelas {selectedClass}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Tanggal:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              {classStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Tidak ada siswa untuk diabsensi.</p>
                  <p className="text-xs">Tambahkan siswa ke kelas {selectedClass} terlebih dahulu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                          <th className="p-3">Nama Siswa</th>
                          <th className="p-3 text-center">Kehadiran</th>
                          <th className="p-3">Keterangan Tambahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classStudents.map(siswa => {
                          const record = attendanceRecords[siswa.id] || { status: 'Hadir', keterangan: '' };
                          return (
                            <tr key={siswa.id} className="hover:bg-slate-50/20">
                              <td className="p-3 font-semibold text-slate-800">{siswa.nama}</td>
                              <td className="p-3">
                                <div className="flex justify-center gap-1.5">
                                  {['Hadir', 'Sakit', 'Izin', 'Alpa'].map(st => (
                                    <button
                                      key={st}
                                      onClick={() => {
                                        setAttendanceRecords({
                                          ...attendanceRecords,
                                          [siswa.id]: { ...record, status: st }
                                        });
                                      }}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                        record.status === st
                                          ? st === 'Hadir' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' :
                                            st === 'Sakit' ? 'bg-amber-500 border-amber-500 text-white shadow-xs' :
                                            st === 'Izin' ? 'bg-blue-600 border-blue-600 text-white shadow-xs' :
                                            'bg-red-600 border-red-600 text-white shadow-xs'
                                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={record.keterangan}
                                  onChange={e => {
                                    setAttendanceRecords({
                                      ...attendanceRecords,
                                      [siswa.id]: { ...record, keterangan: e.target.value }
                                    });
                                  }}
                                  className="w-full px-3 py-1 border border-slate-200 rounded-lg text-xs"
                                  placeholder="Tambahkan catatan jika sakit/izin..."
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveAttendance}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Simpan Absensi Hari Ini</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: JURNAL MENGAJAR */}
          {activeTab === 'jurnal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Jurnal Mengajar' : 'Tulis Jurnal Mengajar'}
                </h3>
                <form onSubmit={handleSaveJournal} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={journalForm.tanggal}
                        onChange={e => setJournalForm({ ...journalForm, tanggal: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                      <input
                        type="text"
                        required
                        value={journalForm.mataPelajaran}
                        onChange={e => setJournalForm({ ...journalForm, mataPelajaran: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Materi Pokok / KD</label>
                    <input
                      type="text"
                      required
                      value={journalForm.materi}
                      onChange={e => setJournalForm({ ...journalForm, materi: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Contoh: Operasi hitung perkalian desimal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kegiatan Pembelajaran</label>
                    <textarea
                      rows={3}
                      required
                      value={journalForm.kegiatan}
                      onChange={e => setJournalForm({ ...journalForm, kegiatan: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Langkah-langkah kegiatan mengajar guru..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Hasil Refleksi Pembelajaran</label>
                    <textarea
                      rows={2}
                      required
                      value={journalForm.refleksi}
                      onChange={e => setJournalForm({ ...journalForm, refleksi: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Hasil evaluasi ketercapaian belajar murid..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Hambatan & Solusi</label>
                    <textarea
                      rows={2}
                      value={journalForm.hambatan}
                      onChange={e => setJournalForm({ ...journalForm, hambatan: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Masalah yang dialami guru/siswa serta penanganannya..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>{editId ? 'Perbarui Jurnal' : 'Simpan Jurnal'}</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setJournalForm({
                            tanggal: new Date().toISOString().split('T')[0],
                            mataPelajaran: isMapel ? mapelName : 'Tematik',
                            materi: '', kegiatan: '', refleksi: '', hambatan: ''
                          });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Jurnal List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Riwayat Jurnal Mengajar Kelas {selectedClass}
                </h3>

                {database.jurnal.filter(j => j.kelas === selectedClass).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ClipboardList size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada catatan jurnal mengajar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {database.jurnal
                      .filter(j => j.kelas === selectedClass)
                      .sort((a,b) => b.tanggal.localeCompare(a.tanggal))
                      .map(j => (
                        <div key={j.id} className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/30 flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{j.mataPelajaran}</span>
                              <span className="text-xs font-mono text-slate-500 font-semibold">{j.tanggal}</span>
                              <span className="text-xs text-slate-400">Oleh: {j.guruNama}</span>
                            </div>
                            <h4 className="font-semibold text-slate-800 text-sm">{j.materi}</h4>
                            <div className="text-xs text-slate-600 leading-relaxed">
                              <strong>Kegiatan:</strong> {j.kegiatan}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] border-t border-slate-100">
                              <div>
                                <span className="font-bold text-emerald-600 block">Refleksi:</span>
                                <span className="text-slate-600 italic">{j.refleksi}</span>
                              </div>
                              {j.hambatan && (
                                <div>
                                  <span className="font-bold text-amber-600 block">Hambatan & Solusi:</span>
                                  <span className="text-slate-600 italic">{j.hambatan}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditId(j.id);
                                setJournalForm({
                                  tanggal: j.tanggal, mataPelajaran: j.mataPelajaran,
                                  materi: j.materi, kegiatan: j.kegiatan, refleksi: j.refleksi, hambatan: j.hambatan
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteJournal(j.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TUGAS SISWA */}
          {activeTab === 'tugas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Tugas Siswa' : 'Buat Tugas Baru'}
                </h3>
                <form onSubmit={handleSaveAssignment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                      <input
                        type="text"
                        required
                        value={assignmentForm.mataPelajaran}
                        onChange={e => setAssignmentForm({ ...assignmentForm, mataPelajaran: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tanggal Batas</label>
                      <input
                        type="date"
                        required
                        value={assignmentForm.tanggalBatas}
                        onChange={e => setAssignmentForm({ ...assignmentForm, tanggalBatas: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Judul Tugas</label>
                    <input
                      type="text"
                      required
                      value={assignmentForm.judulTugas}
                      onChange={e => setAssignmentForm({ ...assignmentForm, judulTugas: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Contoh: Menyelesaikan PR Pecahan Campuran"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Deskripsi Tugas & Instruksi</label>
                    <textarea
                      rows={4}
                      required
                      value={assignmentForm.deskripsi}
                      onChange={e => setAssignmentForm({ ...assignmentForm, deskripsi: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Sebutkan instruksi detail pengumpulan..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Simpan Tugas</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setAssignmentForm({
                            mataPelajaran: isMapel ? mapelName : 'Tematik',
                            judulTugas: '', deskripsi: '', tanggalBatas: new Date().toISOString().split('T')[0]
                          });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Daftar Tugas Aktif Kelas {selectedClass}
                </h3>

                {database.tugas.filter(t => t.kelas === selectedClass).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <BookMarked size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada tugas siswa.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {database.tugas
                      .filter(t => t.kelas === selectedClass)
                      .map(t => (
                        <div key={t.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{t.mataPelajaran}</span>
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">Deadline: {t.tanggalBatas}</span>
                            </div>
                            <h4 className="font-semibold text-slate-800 text-sm pt-1">{t.judulTugas}</h4>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{t.deskripsi}</p>
                          </div>
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditId(t.id);
                                setAssignmentForm({
                                  mataPelajaran: t.mataPelajaran, judulTugas: t.judulTugas,
                                  deskripsi: t.deskripsi, tanggalBatas: t.tanggalBatas
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(t.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: NILAI SISWA */}
          {activeTab === 'nilai' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Input & Rekap Nilai Siswa</h3>
                  <p className="text-xs text-slate-500">Isi dan evaluasi performa akademik siswa kelas {selectedClass}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold mr-1.5">Mapel:</span>
                    <input
                      type="text"
                      value={gradeSubject}
                      onChange={e => setGradeSubject(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white w-32"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold mr-1.5">Jenis:</span>
                    <select
                      value={gradeType}
                      onChange={e => setGradeType(e.target.value as any)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                    >
                      <option value="Tugas">Tugas</option>
                      <option value="Ulangan Harian">Ulangan Harian</option>
                      <option value="UTS">UTS</option>
                      <option value="UAS">UAS</option>
                    </select>
                  </div>
                </div>
              </div>

              {classStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Tidak ada siswa di kelas {selectedClass}.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                          <th className="p-3">Nama Siswa</th>
                          <th className="p-3">Mata Pelajaran</th>
                          <th className="p-3">Kategori Nilai</th>
                          <th className="p-3 text-center w-28">Nilai (0-100)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classStudents.map(siswa => {
                          const score = gradeScores[siswa.id] || 0;
                          return (
                            <tr key={siswa.id} className="hover:bg-slate-50/20">
                              <td className="p-3 font-semibold text-slate-800">{siswa.nama}</td>
                              <td className="p-3 text-slate-600 text-xs">{gradeSubject}</td>
                              <td className="p-3 text-slate-500 text-xs">{gradeType}</td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={score === 0 ? '' : score}
                                  onChange={e => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    setGradeScores({
                                      ...gradeScores,
                                      [siswa.id]: val
                                    });
                                  }}
                                  className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-center text-sm font-bold bg-white"
                                  placeholder="0"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveGrades}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Simpan Kumpulan Nilai</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CATATAN & BIMBINGAN SISWA */}
          {activeTab === 'bimbingan' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Catatan Bimbingan' : 'Konseling & Bimbingan Siswa'}
                </h3>
                <form onSubmit={handleSaveBimbingan} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={bimbinganForm.tanggal}
                        onChange={e => setBimbinganForm({ ...bimbinganForm, tanggal: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pilih Siswa</label>
                      <select
                        required
                        value={bimbinganForm.siswaId}
                        onChange={e => setBimbinganForm({ ...bimbinganForm, siswaId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {classStudents.map(s => (
                          <option key={s.id} value={s.id}>{s.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gejala / Masalah Siswa</label>
                    <textarea
                      rows={2}
                      required
                      value={bimbinganForm.masalah}
                      onChange={e => setBimbinganForm({ ...bimbinganForm, masalah: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Penjelasan masalah atau kendala..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Solusi / Konseling</label>
                    <textarea
                      rows={2}
                      required
                      value={bimbinganForm.solusi}
                      onChange={e => setBimbinganForm({ ...bimbinganForm, solusi: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Langkah penyelesaian yang disepakati..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rencana Tindak Lanjut</label>
                    <textarea
                      rows={2}
                      required
                      value={bimbinganForm.tindakLanjut}
                      onChange={e => setBimbinganForm({ ...bimbinganForm, tindakLanjut: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Saran tindak lanjut bagi wali murid / guru kelas..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Simpan Catatan</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setBimbinganForm({
                            tanggal: new Date().toISOString().split('T')[0],
                            siswaId: '', masalah: '', solusi: '', tindakLanjut: ''
                          });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Log Konseling Kelas {selectedClass}
                </h3>

                {database.bimbingan.filter(b => b.kelas === selectedClass).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <MessageSquare size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada data bimbingan siswa.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {database.bimbingan
                      .filter(b => b.kelas === selectedClass)
                      .map(b => (
                        <div key={b.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-lg">{b.namaSiswa}</span>
                              <span className="text-[11px] text-slate-500 font-mono font-semibold">{b.tanggal}</span>
                            </div>
                            <div className="text-xs text-slate-700 space-y-1">
                              <div><strong>Masalah:</strong> {b.masalah}</div>
                              <div><strong>Solusi:</strong> {b.solusi}</div>
                              <div><strong>Tindak Lanjut:</strong> {b.tindakLanjut}</div>
                            </div>
                          </div>
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditId(b.id);
                                setBimbinganForm({
                                  tanggal: b.tanggal, siswaId: b.siswaId,
                                  masalah: b.masalah, solusi: b.solusi, tindakLanjut: b.tindakLanjut
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteBimbingan(b.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: JADWAL PIKET KELAS */}
          {activeTab === 'piket' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  Kelola Jadwal Piket
                </h3>
                <form onSubmit={handleSavePiket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Hari Piket</label>
                    <select
                      value={piketForm.hari}
                      onChange={e => setPiketForm({ ...piketForm, hari: e.target.value as any })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white"
                    >
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => (
                        <option key={hari} value={hari}>{hari}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Siswa Piket</label>
                    <textarea
                      rows={4}
                      required
                      value={piketForm.namaSiswa}
                      onChange={e => setPiketForm({ ...piketForm, namaSiswa: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Tulis nama-nama siswa dipisah koma (Contoh: Budi, Siti, Riko, Laila)"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save size={16} />
                    <span>Perbarui Piket</span>
                  </button>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Daftar Petugas Piket Kelas {selectedClass}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => {
                    const piketHari = database.piket.find(p => p.kelas === selectedClass && p.hari === hari);
                    return (
                      <div key={hari} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="font-display font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-1.5 mb-2 uppercase tracking-wider text-blue-600 flex justify-between items-center">
                            <span>{hari}</span>
                            <Award size={14} />
                          </div>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                            {piketHari ? piketHari.namaSiswa : <span className="text-slate-400 italic">Belum diatur</span>}
                          </p>
                        </div>
                        {piketHari && (
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => setPiketForm({ hari: piketHari.hari, namaSiswa: piketHari.namaSiswa })}
                              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              Edit Petugas
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: REFLEKSI GURU */}
          {activeTab === 'refleksi' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Catatan Refleksi' : 'Refleksi Diri & Kalimat Motivasi'}
                </h3>
                <form onSubmit={handleSaveReflection} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={reflectionForm.tanggal}
                      onChange={e => setReflectionForm({ ...reflectionForm, tanggal: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Refleksi Kegiatan Mengajar</label>
                    <textarea
                      rows={3}
                      required
                      value={reflectionForm.refleksiDiri}
                      onChange={e => setReflectionForm({ ...reflectionForm, refleksiDiri: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Apa yang berhasil? Apa yang butuh perbaikan minggu ini?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rencana Tindak Lanjut Guru</label>
                    <textarea
                      rows={2}
                      required
                      value={reflectionForm.rencanaTindakLanjut}
                      onChange={e => setReflectionForm({ ...reflectionForm, rencanaTindakLanjut: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Rencana peningkatan kualitas pembelajaran berikutnya..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kalimat Motivasi Hari Ini</label>
                    <input
                      type="text"
                      required
                      value={reflectionForm.kalimatMotivasi}
                      onChange={e => setReflectionForm({ ...reflectionForm, kalimatMotivasi: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Contoh: Terus melangkah walau lelah, demi senyum masa depan!"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Simpan Refleksi</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setReflectionForm({
                            tanggal: new Date().toISOString().split('T')[0],
                            refleksiDiri: '', rencanaTindakLanjut: '', kalimatMotivasi: ''
                          });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Log Evaluasi & Refleksi Guru Kelas {selectedClass}
                </h3>

                {database.refleksi.filter(r => r.kelas === selectedClass).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Flame size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada riwayat catatan refleksi diri.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {database.refleksi
                      .filter(r => r.kelas === selectedClass)
                      .map(r => (
                        <div key={r.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-blue-600">{r.tanggal}</span>
                            <span className="text-xs text-slate-400">Pendidik: {r.guruNama}</span>
                          </div>
                          <div className="text-xs text-slate-700 space-y-2">
                            <div>
                              <strong className="text-blue-700 block mb-0.5">Refleksi Evaluasi:</strong>
                              <p className="italic bg-white p-2 rounded-lg border border-slate-100">{r.refleksiDiri}</p>
                            </div>
                            <div>
                              <strong className="text-indigo-700 block mb-0.5">Tindak Lanjut Peningkatan:</strong>
                              <p className="italic bg-white p-2 rounded-lg border border-slate-100">{r.rencanaTindakLanjut}</p>
                            </div>
                            {r.kalimatMotivasi && (
                              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex items-center gap-2">
                                <Award className="text-amber-600 shrink-0" size={16} />
                                <span className="font-semibold text-amber-900 text-xs italic">"{r.kalimatMotivasi}"</span>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditId(r.id);
                                setReflectionForm({
                                  tanggal: r.tanggal, refleksiDiri: r.refleksiDiri,
                                  rencanaTindakLanjut: r.rencanaTindakLanjut, kalimatMotivasi: r.kalimatMotivasi
                                });
                              }}
                              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReflection(r.id)}
                              className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: INVENTARIS KELAS */}
          {activeTab === 'inventaris' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                  {editId ? 'Edit Inventaris' : 'Tambah Barang Inventaris'}
                </h3>
                <form onSubmit={handleSaveInventory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Barang</label>
                    <input
                      type="text"
                      required
                      value={inventoryForm.namaBarang}
                      onChange={e => setInventoryForm({ ...inventoryForm, namaBarang: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      placeholder="Contoh: Penghapus Papan, Proyektor"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jumlah</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={inventoryForm.jumlah}
                        onChange={e => setInventoryForm({ ...inventoryForm, jumlah: Number(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sumber Perolehan</label>
                      <input
                        type="text"
                        required
                        value={inventoryForm.sumber}
                        onChange={e => setInventoryForm({ ...inventoryForm, sumber: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                        placeholder="BOS, Iuran wali"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kondisi Barang</label>
                    <select
                      value={inventoryForm.kondisi}
                      onChange={e => setInventoryForm({ ...inventoryForm, kondisi: e.target.value as any })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-white"
                    >
                      <option value="Baik">Baik / Layak Pakai</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat (Tidak Berfungsi)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Simpan Barang</span>
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setInventoryForm({ namaBarang: '', jumlah: 1, kondisi: 'Baik', sumber: 'BOS' });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
                <h3 className="font-display font-bold text-slate-800 text-sm pb-4 mb-4 border-b border-slate-100">
                  Aset & Inventaris Kelas {selectedClass}
                </h3>

                {database.inventaris.filter(i => i.kelas === selectedClass).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Inbox size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada inventaris tercatat.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                          <th className="p-3">Nama Barang</th>
                          <th className="p-3 text-center">Jumlah</th>
                          <th className="p-3">Kondisi</th>
                          <th className="p-3">Sumber Dana</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {database.inventaris
                          .filter(i => i.kelas === selectedClass)
                          .map(i => (
                            <tr key={i.id} className="hover:bg-slate-50/20">
                              <td className="p-3 font-semibold text-slate-800">{i.namaBarang}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{i.jumlah}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  i.kondisi === 'Baik' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                  i.kondisi === 'Rusak Ringan' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                  'bg-red-50 border-red-100 text-red-700'
                                }`}>
                                  {i.kondisi}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-slate-600">{i.sumber}</td>
                              <td className="p-3 text-right">
                                <div className="inline-flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditId(i.id);
                                      setInventoryForm({
                                        namaBarang: i.namaBarang, jumlah: i.jumlah,
                                        kondisi: i.kondisi, sumber: i.sumber
                                      });
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInventory(i.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                )}
              </div>
            </div>
          )}

          {/* TAB 11: REKAP DATA & PRINT */}
          {activeTab === 'rekap' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Pratinjau Rekapitulasi Pembelajaran</h3>
                  <p className="text-xs text-slate-500">Hasil rekap guru untuk dicetak dan diserahkan ke Kepala Sekolah</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Printer size={15} />
                  <span>Cetak Lembar Supervisi</span>
                </button>
              </div>

              {/* Printable Document Design */}
              <div id="printable-area" className="border border-slate-200 rounded-xl p-8 bg-white text-slate-900 space-y-6">
                {/* School Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h1 className="text-lg font-bold uppercase tracking-wide">Pemerintah Kabupaten / Dinas Pendidikan</h1>
                  <h2 className="text-xl font-display font-extrabold uppercase">SD NEGERI SUPERVISI UNGGULAN</h2>
                  <p className="text-xs text-slate-500 italic">Jalan Raya Pendidikan No. 221, Madura, Jawa Timur</p>
                </div>

                <div className="text-center pt-2">
                  <h3 className="text-base font-bold uppercase underline">LEMBAR AKTIVITAS SUPERVISI GURU</h3>
                  <p className="text-xs text-slate-500 mt-1">Kelas Pengawasan: {selectedClass} | Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div><strong>Nama Guru:</strong> {profile.nama}</div>
                    <div><strong>NIP/NUPTK:</strong> -</div>
                    <div><strong>Tugas:</strong> {profile.peran}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Target Kelas:</strong> Kelas {selectedClass}</div>
                    <div><strong>Sistem Database:</strong> Cloud Spreadsheet Sync</div>
                    <div><strong>Status Verifikasi:</strong> Membaca Supervisi</div>
                  </div>
                </div>

                {/* Sub table 1: Student summary */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs border-b border-slate-300 pb-1">1. Rekapitulasi Profil Gaya Belajar Siswa</h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border">
                      <div className="font-bold text-indigo-700 text-sm">
                        {classStudents.filter(s => s.gayaBelajar === 'Visual').length}
                      </div>
                      <div className="text-[10px] text-slate-500">Visual</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border">
                      <div className="font-bold text-amber-700 text-sm">
                        {classStudents.filter(s => s.gayaBelajar === 'Auditori').length}
                      </div>
                      <div className="text-[10px] text-slate-500">Auditori</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border">
                      <div className="font-bold text-emerald-700 text-sm">
                        {classStudents.filter(s => s.gayaBelajar === 'Kinestetik').length}
                      </div>
                      <div className="text-[10px] text-slate-500">Kinestetik</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border">
                      <div className="font-bold text-slate-700 text-sm">
                        {classStudents.filter(s => s.gayaBelajar === 'Campuran').length}
                      </div>
                      <div className="text-[10px] text-slate-500">Campuran</div>
                    </div>
                  </div>
                </div>

                {/* Sub table 2: Jurnal Mengajar Terakhir */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs border-b border-slate-300 pb-1">2. Catatan Jurnal Pembelajaran Terakhir</h4>
                  {database.jurnal.filter(j => j.kelas === selectedClass).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada jurnal mengajar terdaftar.</p>
                  ) : (
                    <table className="w-full text-left text-[10px] border-collapse border">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border p-2">Tanggal</th>
                          <th className="border p-2">Mata Pelajaran</th>
                          <th className="border p-2">Materi</th>
                          <th className="border p-2">Kegiatan Pembelajaran & Refleksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {database.jurnal
                          .filter(j => j.kelas === selectedClass)
                          .slice(0, 3)
                          .map(j => (
                            <tr key={j.id}>
                              <td className="border p-2 font-mono whitespace-nowrap">{j.tanggal}</td>
                              <td className="border p-2 font-semibold">{j.mataPelajaran}</td>
                              <td className="border p-2">{j.materi}</td>
                              <td className="border p-2 leading-tight">
                                <strong>Kegiatan:</strong> {j.kegiatan}<br />
                                <strong>Refleksi:</strong> <span className="italic">{j.refleksi}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                  <div className="space-y-12">
                    <div>Guru Pengampu,</div>
                    <div className="font-bold underline">{profile.nama}</div>
                    <div className="text-[10px] text-slate-400">NIP. -----------------------</div>
                  </div>
                  <div className="space-y-12">
                    <div>Mengetahui,<br />Kepala Sekolah</div>
                    <div className="font-bold underline">Achmad Firmansyah, S.Pd., M.Pd.</div>
                    <div className="text-[10px] text-slate-400">NIP. 19781105 200501 1 002</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: SETTINGS / PENGATURAN */}
          {activeTab === 'pengaturan' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="font-display font-bold text-slate-800 text-sm">Pengaturan & Sinkronisasi Database</h3>
                <p className="text-xs text-slate-500">Konfigurasi sinkronisasi data supervisi SD Anda langsung ke Spreadsheet admin.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-blue-800 uppercase">Informasi Akun</h4>
                  <div className="text-xs text-blue-900 space-y-1">
                    <div><strong>Nama Pendidik:</strong> {profile.nama}</div>
                    <div><strong>Surel Pendidik:</strong> {profile.email}</div>
                    <div><strong>Hak Akses Peran:</strong> {profile.peran}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Spreadsheet ID Terkoneksi</label>
                  {spreadsheetId ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        disabled
                        value={spreadsheetId}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 text-slate-500"
                      />
                      <p className="text-[10px] text-slate-400">Semua aktivitas input Anda akan dikirim ke Spreadsheet ini secara otomatis.</p>
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
                          <span>Tinjau Spreadsheet</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-slate-50/50">
                      <p className="text-xs text-slate-500">Saat ini Anda menggunakan database luring (offline) karena Google Spreadsheet belum diinisialisasi.</p>
                      <button
                        onClick={onForceSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                        <span>Hubungkan & Buat Spreadsheet</span>
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
