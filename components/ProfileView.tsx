import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getProfileStats, ProfileStats } from '../services/api';
import AuthView from './AuthView';

const ProfileView: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<ProfileStats>({ favoritesCount: 0, notesCount: 0, streakDays: 0 });

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load Stats when user is available
    useEffect(() => {
        if (user) {
            getProfileStats().then(setStats).catch(console.error);
        }
    }, [user]);

    const handleLogin = async () => {
        setAuthLoading(true);
        setErrorMsg(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
            // Note: OAuth will redirect the user, so the code below might not run immediately
            // or effectively until they return.
        } catch (error: any) {
            console.error("Login failed", error);
            setAuthLoading(false);
            setErrorMsg(error.message || "Falha ao iniciar login com Google.");
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <AuthView onLogin={handleLogin} isLoading={authLoading} errorMessage={errorMsg} />;
    }

    // Helper to safely get user data
    const photoURL = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || "Viajante";

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark animate-in fade-in duration-300">
            {/* Top Bar relative to component */}
            <div className="pt-8 pb-6 px-6 relative">
                <h1 className="text-2xl font-bold text-[#1c1a0d] dark:text-white mb-1 font-serif">Meu Perfil</h1>
                <p className="text-gray-500 text-sm">Gerencie sua conta e preferências</p>
            </div>

            <main className="flex-1 px-6 pb-24 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                    {/* User Card */}
                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center gap-4 shadow-sm">
                        {photoURL ? (
                            <img
                                src={photoURL}
                                alt={displayName}
                                className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/50">
                                <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-[#1c1a0d] dark:text-white leading-tight">
                                {displayName}
                            </h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                            <p className="text-3xl font-bold text-[#fcfbf8] mb-1">{stats.streakDays}</p>
                            <p className="text-xs text-[#fcfbf8]/60 uppercase tracking-widest">Dias Consecutivos</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                            <p className="text-3xl font-bold text-[#fcfbf8] mb-1">{stats.favoritesCount}</p>
                            <p className="text-xs text-[#fcfbf8]/60 uppercase tracking-widest">Favoritos</p>
                        </div>
                    </div>

                    {/* Settings List */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
                        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">settings</span>
                                </div>
                                <span className="text-[#1c1a0d] dark:text-white font-medium">Configurações</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward_ios</span>
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">notifications</span>
                                </div>
                                <span className="text-[#1c1a0d] dark:text-white font-medium">Notificações</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward_ios</span>
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">help</span>
                                </div>
                                <span className="text-[#1c1a0d] dark:text-white font-medium">Ajuda</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward_ios</span>
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sair da Conta
                    </button>

                    <p className="text-center text-xs text-gray-400">Versão 1.0.0</p>
                </div>
            </main>
        </div>
    );
};

export default ProfileView;
