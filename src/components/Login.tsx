import React, { useState } from 'react';
import { googleSignIn } from '../lib/firebase';
import { BookOpen, ShieldCheck, CheckCircle, RefreshCw, KeyRound, Users, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string, roleHint: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  });

  const handleSignIn = async (roleHint: string) => {
    setLoading(true);
    setActiveHint(roleHint);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onLoginSuccess(result.user, result.accessToken, roleHint);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('popup-closed-by-user') || errMsg.includes('popup-closed')) {
        setError('popup-closed');
      } else {
        setError(errMsg || 'Gagal masuk dengan Google. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
      setActiveHint(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl text-center px-4">
        <div className="flex justify-center animate-fade-in mb-4">
          <div className="h-16 w-16 bg-indigo-650 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/10 border border-white/20">
            <BookOpen size={36} className="stroke-[1.5]" />
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-indigo-900">
          Supervisi SD
        </h2>
        <p className="mt-2 text-sm sm:text-base text-indigo-950/80 max-w-xl mx-auto font-medium">
          Sistem Pemantauan & Supervisi Guru Sekolah Dasar Berbasis Google Sheets
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        {isInIframe && (
          <div className="mb-6 p-4 bg-amber-50/95 backdrop-blur-md border border-amber-200 text-amber-900 rounded-2xl text-xs flex flex-col gap-2 max-w-2xl mx-auto shadow-md">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="shrink-0 text-amber-600 mt-0.5" size={18} />
              <div>
                <strong className="block text-amber-950 font-bold mb-1 text-sm">Mode Preview Terdeteksi (Iframe)</strong>
                Google Authentication membatasi pembukaan jendela pop-up login jika aplikasi dijalankan di dalam iframe preview.
                <div className="mt-2 text-slate-700 leading-relaxed font-normal">
                  💡 <strong>Solusi:</strong> Silakan klik tombol <strong>"Buka di Tab Baru"</strong> (Open in New Tab) di pojok kanan atas layar Anda, lalu login kembali di tab baru tersebut agar pop-up Google dapat terbuka lancar tanpa hambatan iframe!
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-md border border-red-200 text-red-800 rounded-2xl text-xs flex flex-col gap-2 max-w-xl mx-auto shadow-md">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="shrink-0 text-red-500 mt-0.5" size={18} />
              <div>
                {error === 'popup-closed' ? (
                  <>
                    <strong className="block text-red-950 font-bold mb-1 text-sm">Pop-up Google Ditutup atau Diblokir</strong>
                    Jendela login Google ditutup sebelum menyelesaikan masuk atau diblokir oleh browser karena aplikasi berada di dalam iframe (Preview).
                    <div className="mt-3 p-3 bg-white/95 border border-indigo-100 rounded-xl text-slate-700 leading-relaxed font-normal shadow-inner">
                      👉 <strong>Solusi Mudah:</strong> Silakan klik tombol <strong>"Buka di Tab Baru"</strong> (Open in New Tab) yang berada di pojok kanan atas layar preview AI Studio ini, lalu coba klik tombol masuk kembali di tab baru tersebut agar pop-up Google dapat terbuka lancar tanpa hambatan iframe!
                    </div>
                  </>
                ) : (
                  <span>Gagal masuk dengan Google: {error}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: KEPALA SEKOLAH */}
          <div className="bg-white/70 backdrop-blur-xl py-8 px-6 shadow-xl border border-white/40 rounded-3xl flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-indigo-100/40 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200/40">
                  <ShieldCheck size={22} className="stroke-[2]" />
                </div>
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/50 border border-indigo-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Langkah 1 (Utama)
                </span>
              </div>
              <h3 className="text-lg font-bold text-indigo-950 font-display">
                Akses Kepala Sekolah & Admin
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Sistem login pertama untuk Kepala Sekolah (Admin). Berfungsi membuat, memantau, atau menautkan Google Spreadsheet sekolah sebagai database utama cloud.
              </p>
              
              <div className="mt-6 space-y-3">
                <h4 className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-widest">Fitur Eksklusif Kepala Sekolah:</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="text-indigo-600 shrink-0 mt-0.5" size={14} />
                    <span>Inisialisasi & menautkan Google Spreadsheet sekolah otomatis</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="text-indigo-600 shrink-0 mt-0.5" size={14} />
                    <span>Supervisi kegiatan, hambatan, & refleksi mengajar seluruh guru</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="text-indigo-600 shrink-0 mt-0.5" size={14} />
                    <span>Manajemen otorisasi akun guru, rekap laporan, & data siswa</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-indigo-100/20">
              <button
                onClick={() => handleSignIn('Kepala Sekolah')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-indigo-200/20 rounded-2xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-sm transition-all shadow-md hover:shadow-indigo-500/5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading && activeHint === 'Kepala Sekolah' ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <div className="flex items-center justify-center">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-3 shrink-0 bg-white p-0.5 rounded-full">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Masuk sebagai Kepala Sekolah</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* CARD 2: GURU KELAS & MAPEL */}
          <div className="bg-white/70 backdrop-blur-xl py-8 px-6 shadow-xl border border-white/40 rounded-3xl flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-emerald-100/40 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200/40">
                  <Users size={22} className="stroke-[2]" />
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Langkah 2 (Daftar Baru)
                </span>
              </div>
              <h3 className="text-lg font-bold text-indigo-950 font-display">
                Akses Guru Kelas & Mapel
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Sistem login kedua untuk semua Guru SDN. Berfungsi mendaftar akun baru secara mandiri, mengelola data siswa, mengisi jurnal, absen, tugas, nilai, & piket.
              </p>

              <div className="mt-6 space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Fitur Pengisian Mandiri Guru:</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span>Pengisian Jurnal Harian mengajar beserta hambatan & solusi</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span>Pemetaan Gaya Belajar & Profil Belajar Siswa (Visual/Auditori/Kinestetik)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span>Rekap Evaluasi: Absensi harian, Nilai Ulangan, Tugas, & Bimbingan</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-indigo-100/20">
              <button
                onClick={() => handleSignIn('Guru Kelas 1')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-emerald-200 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading && activeHint === 'Guru Kelas 1' ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <div className="flex items-center justify-center">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-3 shrink-0 bg-white p-0.5 rounded-full">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Daftar / Masuk sebagai Guru</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips for switching account */}
        <div className="mt-8 p-4 bg-indigo-50/50 backdrop-blur-md border border-indigo-150/20 rounded-2xl flex items-start gap-3 max-w-4xl mx-auto">
          <KeyRound size={20} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed font-medium">
            <strong>💡 Sistem Pemilihan Akun Ganti Akun:</strong> Tombol masuk di atas dioptimalkan secara dinamis untuk selalu menawarkan pemilihan akun Google ("Ganti Akun"). Jika Anda ingin mendaftarkan akun Guru baru atau beralih dari akun Kepala Sekolah, cukup klik tombol masuk dan pilih akun Google baru Anda dengan mudah.
          </div>
        </div>
      </div>
    </div>
  );
}
