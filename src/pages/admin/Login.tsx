import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import heroBanner from '@/assets/hero-banner.jpg';

export default function AdminLogin() {
  const { signIn } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Same hero background as home page */}
      <div className="absolute inset-0">
        <img src={heroBanner} alt="Background" className="w-full h-full object-cover" style={{ filter: 'blur(3px) brightness(0.6)', transform: 'scale(1.06)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-[#1A1A1A]/90" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(230,194,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(230,194,0,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-[#E6C200]/30 backdrop-blur-sm">
            <img
              src="/src/assets/ninjadaddy-logo.png"
              alt="Ninjadaddy"
              className="w-full h-full object-cover"
              onError={e => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent) parent.innerHTML = '<span style="color:#E6C200;font-size:2.5rem;font-weight:900">N</span>';
              }}
            />
          </div>
          <h1 className="text-3xl font-900 text-white tracking-tight">
            NINJA<span className="text-[#E6C200]">DADDY</span>
          </h1>
          <p className="text-sm text-white/60 mt-1 font-500">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="p-6 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl space-y-5 shadow-2xl">
          <div className="flex items-center gap-2 p-3 bg-[#E6C200]/10 border border-[#E6C200]/25 rounded-xl">
            <Shield className="w-4 h-4 text-[#E6C200]" />
            <p className="text-xs text-[#E6C200] font-600">Secure admin access only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/60 block mb-1.5 font-600">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ninjadaddy@gmail.com"
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E6C200]/60 transition-colors backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5 font-600">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E6C200]/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#E6C200] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#E6C200] text-black font-900 rounded-xl hover:bg-[#B8A000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
              {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Enter Admin Dashboard'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6 font-500">
          Ninjadaddy Supplies © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
