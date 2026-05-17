import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const AuthView: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        // Simple validation
        if (!email.trim() || !password.trim()) {
            setErrorMessage("Por favor, preencha todos os campos.");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
            setIsLoading(false);
            return;
        }

        if (isSignUp && !fullName.trim()) {
            setErrorMessage("Por favor, informe seu nome.");
            setIsLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                // Register new user
                const { data, error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: {
                        data: {
                            full_name: fullName.trim(),
                        }
                    }
                });

                if (error) throw error;

                // Depending on Supabase configuration, the user might be signed in automatically
                if (data.session) {
                    setSuccessMessage("Conta criada e conectada com sucesso!");
                } else {
                    setSuccessMessage("Cadastro realizado! Um e-mail de confirmação foi enviado.");
                    // Reset fields
                    setEmail('');
                    setPassword('');
                    setFullName('');
                }
            } else {
                // Log in existing user
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                });

                if (error) throw error;
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            // Translate common Supabase Auth errors to Portuguese
            let message = error.message;
            if (message === "Invalid login credentials") {
                message = "E-mail ou senha incorretos. Por favor, tente novamente.";
            } else if (message === "User already registered") {
                message = "Este endereço de e-mail já está cadastrado.";
            }
            setErrorMessage(message || "Ocorreu um erro na autenticação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-6 bg-background-light dark:bg-background-dark text-center relative overflow-y-auto custom-scrollbar">
            {/* Background Decorative Blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="z-10 flex flex-col items-center space-y-6 max-w-sm w-full py-8 animate-in fade-in zoom-in duration-500">
                
                {/* App Branding */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-[#d4b60b] rounded-3xl rotate-3 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-4xl text-white drop-shadow-sm">light_mode</span>
                    </div>
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] leading-tight">
                            Luz do Caminho
                        </h1>
                        <p className="font-display text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-[260px] mx-auto leading-relaxed">
                            Sua jornada espiritual diária com paz, reflexão e sabedoria.
                        </p>
                    </div>
                </div>

                {/* Tab Switcher (Login / Signup) */}
                <div className="w-full bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(false);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            !isSignUp
                                ? 'bg-white dark:bg-[#332e18] text-[#1c1a0d] dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(true);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            isSignUp
                                ? 'bg-white dark:bg-[#332e18] text-[#1c1a0d] dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        Criar Conta
                    </button>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
                    {isSignUp && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 pl-1">Nome Completo</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400 text-lg">person</span>
                                </span>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Como quer ser chamado?"
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#1c1a0d] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 pl-1">E-mail</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 text-lg">mail</span>
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu.email@exemplo.com"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#1c1a0d] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 pl-1">Senha</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 text-lg">lock</span>
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#1c1a0d] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 relative flex items-center justify-center bg-primary hover:bg-[#d4b60b] dark:bg-primary dark:hover:bg-[#d4b60b] text-[#1c1a0d] font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
                    >
                        <span>{isSignUp ? 'Criar Minha Conta' : 'Entrar'}</span>
                        {isLoading && (
                            <div className="absolute right-6 w-5 h-5 border-2 border-[#1c1a0d] border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </button>
                </form>

                {/* Notifications */}
                {errorMessage && (
                    <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl text-center animate-in fade-in slide-in-from-top-2 duration-300">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="w-full bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 text-xs px-4 py-3 rounded-xl text-center animate-in fade-in slide-in-from-top-2 duration-300">
                        {successMessage}
                    </div>
                )}

                <p className="text-[10px] text-center text-gray-400 px-4 mt-2 leading-relaxed">
                    Sua segurança é nossa prioridade. Para fins de sincronização espiritual entre dispositivos, armazenamos seus dados de progresso de forma criptografada.
                </p>
            </div>
        </div>
    );
};

export default AuthView;
