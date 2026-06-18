import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../theme/useTheme';

export function SplashScreen() {
  const navigate = useNavigate();
  const { ensureUser } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      ensureUser().then(() => navigate('/agents'));
    }, 2000);
    return () => clearTimeout(timer);
  }, [ensureUser, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 0%, ${colors.gradient[0]}22 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, ${colors.gradient[1]}22 0%, transparent 60%), ${colors.background}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          fontWeight: 800,
          color: colors.textInverse,
          animation: 'pulse 2s ease-in-out infinite',
          boxShadow: `0 0 60px ${colors.gradient[0]}44`,
        }}
      >
        灵
      </div>
      <h1
        style={{
          marginTop: 24,
          fontSize: 28,
          fontWeight: 800,
          background: `linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        灵伴
      </h1>
      <p style={{ marginTop: 8, color: colors.textSecondary, fontSize: 14 }}>
        AI 智能体助手
      </p>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
