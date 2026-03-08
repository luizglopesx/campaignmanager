import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /* Shared input style */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#374151',
    background: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#F9FAFB' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-xl font-bold text-xl mb-4"
            style={{
              height: '56px',
              width: '56px',
              background: '#3B82F6',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}
          >
            CM
          </div>
          <h1
            className="font-bold"
            style={{ fontSize: '28px', color: '#3B82F6', letterSpacing: '-0.02em' }}
          >
            Campaign Manager
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
            Senhor Colchão
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <h2
            className="font-semibold mb-1"
            style={{ fontSize: '22px', color: '#1F2937', letterSpacing: '-0.01em' }}
          >
            {isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            {isRegister
              ? 'Preencha os dados para começar'
              : 'Entre com suas credenciais'}
          </p>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 rounded-lg"
              style={{
                padding: '10px 14px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name (register only) */}
            {isRegister && (
              <div>
                <label
                  className="block font-medium"
                  style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  placeholder="Seu nome completo"
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="block font-medium"
                style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}
              >
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                placeholder="email@empresa.com"
                required
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block font-medium"
                style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}
              >
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors"
              style={{
                width: '100%',
                padding: '10px 16px',
                background: loading ? '#93C5FD' : '#3B82F6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
                }
              }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isRegister ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          {/* Toggle login/register */}
          <div className="text-center" style={{ marginTop: '24px' }}>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                fontSize: '13px',
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                transition: 'text-decoration-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.textDecorationColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.textDecorationColor = 'transparent';
              }}
            >
              {isRegister
                ? 'Já tem uma conta? Faça login'
                : 'Primeiro acesso? Crie sua conta'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          className="text-center"
          style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '24px' }}
        >
          © 2026 Senhor Colchão — Campaign Manager v1.0
        </p>
      </div>
    </div>
  );
}
