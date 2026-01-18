import React, { useEffect, useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import AuthView from './AuthView';

const ProfileView: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            setAuthLoading(false); // Reset loading state on change
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        setAuthLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            // Auth state listener will handle the rest
        } catch (error) {
            console.error("Login failed", error);
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
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
        return <AuthView onLogin={handleLogin} isLoading={authLoading} />;
    }

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
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/50">
                                <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-[#1c1a0d] dark:text-white leading-tight">
                                {user.displayName || "Viajante"}
                            </h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/10">
                            <span className="block text-2xl font-bold text-primary">7</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold tracking-wider">Dias Consecutivos</span>
                        </div>
                        <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/10">
                            <span className="block text-2xl font-bold text-primary">12</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold tracking-wider">Favoritos</span>
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
