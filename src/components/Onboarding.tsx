import React, { useState } from 'react';
import { UserRole, Pengguna } from '../types';
import { Save, User, Phone, Briefcase, RefreshCw, LogOut } from 'lucide-react';

interface OnboardingProps {
  email: string;
  initialName: string;
  initialRole?: UserRole;
  onComplete: (profile: Pengguna) => void;
  onLogout: () => void;
}

export default function Onboarding({ email, initialName, initialRole, onComplete, onLogout }: OnboardingProps) {
  const [nama, setNama] = useState(initialName || '');
  const [peran, setPeran] = useState<UserRole>(initialRole || 'Guru Kelas 1');
  const [noHp, setNoHp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    setLoading(true);
    // Mimic API delay
    setTimeout(() => {
      onComplete({
        email,
        nama: nama.trim(),
        peran,
        noHp: noHp.trim() || '-'
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-display font-black tracking-tight text-indigo-900">
          Lengkapi Profil Guru
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Akun Anda <span className="font-semibold text-indigo-950">{email}</span> belum terdaftar di sistem. Silakan lengkapi profil Anda terlebih dahulu.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/65 backdrop-blur-xl py-8 px-4 shadow-2xl border border-white/40 rounded-3xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nama" className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                Nama Lengkap & Gelar
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500/80">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="nama"
                  id="nama"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-slate-900 bg-white/80"
                  placeholder="Contoh: Siti Aminah, S.Pd."
                />
              </div>
            </div>

            <div>
              <label htmlFor="peran" className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                Tugas / Jabatan di Sekolah
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500/80">
                  <Briefcase size={18} />
                </div>
                <select
                  name="peran"
                  id="peran"
                  value={peran}
                  onChange={(e) => setPeran(e.target.value as UserRole)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-slate-900 bg-white/80"
                >
                  <optgroup label="Pimpinan">
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Admin">Admin Sekolah</option>
                  </optgroup>
                  <optgroup label="Guru Kelas (Wali Kelas)">
                    <option value="Guru Kelas 1">Guru Kelas 1</option>
                    <option value="Guru Kelas 2">Guru Kelas 2</option>
                    <option value="Guru Kelas 3">Guru Kelas 3</option>
                    <option value="Guru Kelas 4">Guru Kelas 4</option>
                    <option value="Guru Kelas 5">Guru Kelas 5</option>
                    <option value="Guru Kelas 6">Guru Kelas 6</option>
                  </optgroup>
                  <optgroup label="Guru Mata Pelajaran">
                    <option value="Guru Mapel PAI">Guru Mapel PAI (Agama)</option>
                    <option value="Guru Mapel PJOK">Guru Mapel PJOK (Olahraga)</option>
                    <option value="Guru Mapel Bahasa Inggris">Guru Mapel Bahasa Inggris</option>
                    <option value="Guru Mapel BTQ">Guru Mapel BTQ</option>
                    <option value="Guru Mapel Mulok Bahasa Madura">Guru Mapel Mulok B. Madura</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="noHp" className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                Nomor WhatsApp Aktif
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500/80">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  name="noHp"
                  id="noHp"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-slate-900 bg-white/80"
                  placeholder="Contoh: 08123456789"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent rounded-xl shadow-md hover:shadow-indigo-500/10 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Simpan & Masuk ke Dashboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white/60 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                <span>Keluar Akun Google</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
