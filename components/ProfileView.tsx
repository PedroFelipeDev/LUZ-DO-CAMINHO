import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getProfileStats, ProfileStats } from '../services/api';
import AuthView from './AuthView';

const ProfileView: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ProfileStats>({ favoritesCount: 0, notesCount: 0, streakDays: 0 });

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [avatarInput, setAvatarInput] = useState("");
    const [updatingEmail, setUpdatingEmail] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [updatingAvatar, setUpdatingAvatar] = useState(false);

    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        if (user) {
            setEmailInput(user.email || "");
            setAvatarInput(user.user_metadata?.avatar_url || user.user_metadata?.picture || "");
        }
    }, [user]);

    const changeThemeMode = (mode: 'light' | 'dark') => {
        if (mode === 'dark') {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkTheme(true);
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
            setIsDarkTheme(false);
        }
    };

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
            getProfileStats()
                .then(setStats)
                .catch(err => {
                    console.error("Failed to load profile stats", err);
                    // Keep default 0 stats - no broken UI
                });
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUpdatingAvatar(true);
        try {
            // Read file as Base64 Data URL
            const reader = new FileReader();
            reader.onload = async (event) => {
                const img = new Image();
                img.onload = async () => {
                    // Create canvas to resize and crop square to 150x150
                    const canvas = document.createElement('canvas');
                    canvas.width = 150;
                    canvas.height = 150;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Crop square from center of the image
                        const minDim = Math.min(img.width, img.height);
                        const sx = (img.width - minDim) / 2;
                        const sy = (img.height - minDim) / 2;
                        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 150, 150);
                        
                        // Compress to efficient JPEG (usually ~8KB)
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                        
                        // Save base64 directly in Supabase User Metadata
                        const { error } = await supabase.auth.updateUser({
                            data: { avatar_url: compressedBase64 }
                        });
                        if (error) throw error;

                        setAvatarInput(compressedBase64);
                        setUser(prev => ({
                            ...prev,
                            user_metadata: {
                                ...prev.user_metadata,
                                avatar_url: compressedBase64
                            }
                        }));
                        alert("Foto de perfil atualizada com sucesso!");
                    }
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao processar imagem: ${error.message || error}`);
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!user) return;
        setUpdatingEmail(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: emailInput
            });
            if (error) throw error;
            alert("E-mail atualizado! Um link de validação foi enviado para ambos os e-mails (antigo e novo) para confirmar a alteração.");
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao atualizar e-mail: ${error.message || error}`);
        } finally {
            setUpdatingEmail(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!user) return;
        setUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordInput
            });
            if (error) throw error;
            alert("Senha atualizada com sucesso!");
            setPasswordInput("");
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao atualizar senha: ${error.message || error}`);
        } finally {
            setUpdatingPassword(false);
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
        return <AuthView />;
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
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10 text-center shadow-sm">
                            <p className="text-3xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] mb-1">{stats.streakDays}</p>
                            <p className="text-xs text-gray-500 dark:text-[#fcfbf8]/60 uppercase tracking-widest">Dias Consecutivos</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10 text-center shadow-sm">
                            <p className="text-3xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] mb-1">{stats.favoritesCount}</p>
                            <p className="text-xs text-gray-500 dark:text-[#fcfbf8]/60 uppercase tracking-widest">Favoritos</p>
                        </div>
                    </div>

                    {/* Settings List */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 group"
                        >
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

            {/* Settings Sub-View Overlay */}
            {settingsOpen && (
                <div className="absolute inset-0 z-50 bg-background-light dark:bg-background-dark flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Settings Header */}
                    <div className="flex items-center gap-3 p-6 border-b border-gray-100 dark:border-white/5">
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center text-gray-500"
                        >
                            <span className="material-symbols-outlined text-2xl font-bold">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-[#1c1a0d] dark:text-white font-serif">Configurações</h2>
                            <p className="text-xs text-gray-400">Edite suas credenciais e preferências</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pt-4 pb-28 space-y-6 custom-scrollbar">
                        {/* Tema Mode Toggle Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aparência do Aplicativo</h3>
                            <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex gap-1 border border-gray-200/50 dark:border-white/5">
                                <button
                                    onClick={() => changeThemeMode('light')}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                        !isDarkTheme 
                                            ? 'bg-white text-[#1c1a0d] shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">light_mode</span>
                                    Modo Claro
                                </button>
                                <button
                                    onClick={() => changeThemeMode('dark')}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                        isDarkTheme 
                                            ? 'bg-[#332e18] text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">dark_mode</span>
                                    Modo Escuro
                                </button>
                            </div>
                        </div>

                        {/* Foto de Perfil Section */}
                        <div className="space-y-4 p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Foto de Perfil</h3>
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="relative">
                                    {avatarInput ? (
                                        <img
                                            src={avatarInput}
                                            alt="Prévia Avatar"
                                            className="w-24 h-24 rounded-full border-4 border-primary object-cover shadow-md"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary border-4 border-primary/50 shadow-md">
                                            <span className="material-symbols-outlined text-5xl">person</span>
                                        </div>
                                    )}
                                    {updatingAvatar && (
                                        <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                                            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full space-y-2">
                                    <label className="inline-flex items-center gap-2 bg-[#1c1a0d] dark:bg-white text-white dark:text-[#1c1a0d] px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm hover:opacity-90 transition-all active:scale-95">
                                        <span className="material-symbols-outlined text-sm">upload</span>
                                        Selecionar Foto do Aparelho
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={updatingAvatar}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-[10px] text-gray-400">Suporta arquivos PNG, JPG ou WEBP. A foto é ajustada automaticamente.</p>
                                </div>
                            </div>
                        </div>

                        {/* Credenciais Section */}
                        <div className="space-y-4 p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Configurações de Acesso</h3>
                            
                            {/* Email Edit */}
                            <div className="space-y-1.5 border-b border-gray-100 dark:border-white/5 pb-4">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Endereço de E-mail</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="flex-1 text-xs bg-gray-50 dark:bg-black/10 border border-gray-200 dark:border-white/10 p-2.5 rounded-xl text-[#1c1a0d] dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={handleUpdateEmail}
                                        disabled={updatingEmail || emailInput === user.email}
                                        className="bg-[#1c1a0d] dark:bg-white text-white dark:text-[#1c1a0d] font-bold text-xs px-3.5 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
                                    >
                                        {updatingEmail ? "..." : "Alterar"}
                                    </button>
                                </div>
                            </div>

                            {/* Password Edit */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Nova Senha</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        placeholder="Digite nova senha..."
                                        className="flex-1 text-xs bg-gray-50 dark:bg-black/10 border border-gray-200 dark:border-white/10 p-2.5 rounded-xl text-[#1c1a0d] dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={updatingPassword || passwordInput.length < 6}
                                        className="bg-[#1c1a0d] dark:bg-white text-white dark:text-[#1c1a0d] font-bold text-xs px-3.5 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
                                    >
                                        {updatingPassword ? "..." : "Alterar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
