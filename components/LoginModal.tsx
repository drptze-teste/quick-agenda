import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        onLoginSuccess();
        setPassword('');
      } else {
        setError('Senha administrativa incorreta.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-white/20">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Lock className="text-corporate-blue" size={24} />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-corporate-blue tracking-tight mb-2">Acesso Restrito</h3>
          <p className="text-sm text-slate-500 font-medium mb-8">Digite a senha administrativa para acessar as configurações do sistema.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-corporate-blue focus:bg-white outline-none transition-all font-bold text-slate-700 text-center tracking-widest"
                required
              />
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-corporate-blue text-white font-bold rounded-2xl hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : (
                <>
                  <ShieldCheck size={20} />
                  Entrar no Painel
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
