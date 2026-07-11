import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  logout, 
  getAccessToken 
} from './lib/firebase';
import { 
  getLocalData, 
  saveFullLocalData, 
  findOrCreateSpreadsheet, 
  pullFullDataFromSheets, 
  getSpreadsheetId,
  pushTableToSheets
} from './lib/googleSheets';
import { Pengguna, AppDatabase, UserRole } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import DashboardGuru from './components/DashboardGuru';
import DashboardKepalaSekolah from './components/DashboardKepalaSekolah';
import { RefreshCw, BookOpen, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Pengguna | null>(null);
  const [onboardingRoleHint, setOnboardingRoleHint] = useState<UserRole | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [database, setDatabase] = useState<AppDatabase>(getLocalData());
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // 1. Listen to Firebase Authentication State Changes
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        
        // Find if user has a profile registered
        const currentDb = getLocalData();
        setDatabase(currentDb);
        
        const existingProfile = currentDb.pengguna.find(
          p => p.email.toLowerCase() === firebaseUser.email?.toLowerCase()
        );

        if (existingProfile) {
          setProfile(existingProfile);
          // Try to sync with Google Sheets automatically
          try {
            setSyncing(true);
            const sheetId = await findOrCreateSpreadsheet(token, 'SDN Supervisi');
            setSpreadsheetId(sheetId);
            
            // Perform an initial pull of latest records
            const syncedDb = await pullFullDataFromSheets(token, sheetId);
            setDatabase(syncedDb);
          } catch (err) {
            console.warn('Auto sync sheets failed on load', err);
          } finally {
            setSyncing(false);
          }
        }
        setLoading(false);
      },
      () => {
        // Not logged in or token expired
        setUser(null);
        setAccessToken(null);
        setProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Handle Login Action Success
  const handleLoginSuccess = async (loggedInUser: User, token: string, roleHint?: string) => {
    setLoading(true);
    setUser(loggedInUser);
    setAccessToken(token);
    if (roleHint) {
      setOnboardingRoleHint(roleHint as UserRole);
    }

    const currentDb = getLocalData();
    setDatabase(currentDb);

    const existingProfile = currentDb.pengguna.find(
      p => p.email.toLowerCase() === loggedInUser.email?.toLowerCase()
    );

    if (existingProfile) {
      setProfile(existingProfile);
      try {
        setSyncing(true);
        const sheetId = await findOrCreateSpreadsheet(token, 'SDN Supervisi');
        setSpreadsheetId(sheetId);
        
        const syncedDb = await pullFullDataFromSheets(token, sheetId);
        setDatabase(syncedDb);
      } catch (err) {
        console.warn('Sync sheets failed on login', err);
      } finally {
        setSyncing(false);
      }
    } else {
      // User must fill profile in Onboarding component first
      setProfile(null);
    }
    setLoading(false);
  };

  // 3. Handle Profile Registration Completion
  const handleOnboardingComplete = async (newProfile: Pengguna) => {
    setLoading(true);
    try {
      // Save profile locally
      const currentDb = { ...database };
      
      // Ensure email uniqueness
      if (!currentDb.pengguna.some(p => p.email.toLowerCase() === newProfile.email.toLowerCase())) {
        currentDb.pengguna.push(newProfile);
      } else {
        currentDb.pengguna = currentDb.pengguna.map(p => 
          p.email.toLowerCase() === newProfile.email.toLowerCase() ? newProfile : p
        );
      }

      setDatabase(currentDb);
      saveFullLocalData(currentDb);
      setProfile(newProfile);

      // Now set up spreadsheet integration
      if (accessToken) {
        setSyncing(true);
        const sheetId = await findOrCreateSpreadsheet(accessToken, 'SDN Supervisi');
        setSpreadsheetId(sheetId);

        // Push the new user list to Google Sheets so that Kepala Sekolah and other users can see it
        try {
          await pushTableToSheets(accessToken, sheetId, 'pengguna', currentDb.pengguna);
        } catch (syncErr) {
          console.warn('Gagal push tabel pengguna ke Sheets pada onboarding:', syncErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setAppError('Gagal menyinkronkan profil Anda ke Google Sheets database.');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  // 4. Force Bidirectional Synchronization
  const handleForceSync = async () => {
    if (!accessToken) return;
    setSyncing(true);
    try {
      const token = accessToken;
      const sheetId = await findOrCreateSpreadsheet(token, 'SDN Supervisi');
      setSpreadsheetId(sheetId);
      
      const syncedDb = await pullFullDataFromSheets(token, sheetId);
      setDatabase(syncedDb);
    } catch (err) {
      console.error(err);
      alert('Gagal sinkronisasi data dengan Google Sheets. Silakan coba masuk kembali.');
    } finally {
      setSyncing(false);
    }
  };

  // 5. Update Local Database state
  const handleUpdateDatabase = (updatedDb: AppDatabase) => {
    setDatabase(updatedDb);
    saveFullLocalData(updatedDb);
  };

  // 6. Handle Logout Action
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setProfile(null);
      setSpreadsheetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 mb-4 animate-pulse">
          <BookOpen size={32} />
        </div>
        <RefreshCw className="animate-spin text-indigo-600" size={24} />
        <p className="mt-4 text-sm font-semibold text-slate-700">Memuat Sistem Supervisi SD...</p>
        <p className="text-xs text-slate-400 mt-1">Menyelaraskan kredensial dengan Google Drive</p>
      </div>
    );
  }

  // Not Logged In Screen
  if (!user || !accessToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Onboarding Profile Registration Screen
  if (!profile) {
    return (
      <Onboarding 
        email={user.email || ''} 
        initialName={user.displayName || ''} 
        initialRole={onboardingRoleHint || undefined}
        onComplete={handleOnboardingComplete}
        onLogout={handleLogout}
      />
    );
  }

  // Dashboard Decision Routing
  const isSupervisor = profile.peran === 'Kepala Sekolah' || profile.peran === 'Admin';

  if (isSupervisor) {
    return (
      <DashboardKepalaSekolah
        user={user}
        accessToken={accessToken}
        profile={profile}
        spreadsheetId={spreadsheetId}
        database={database}
        onUpdateDatabase={handleUpdateDatabase}
        onLogout={handleLogout}
        onForceSync={handleForceSync}
        syncing={syncing}
      />
    );
  }

  return (
    <DashboardGuru
      user={user}
      accessToken={accessToken}
      profile={profile}
      spreadsheetId={spreadsheetId}
      database={database}
      onUpdateDatabase={handleUpdateDatabase}
      onLogout={handleLogout}
      onForceSync={handleForceSync}
      syncing={syncing}
    />
  );
}
