import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/useTheme';
import { ACCENTS } from '../theme/colors';
import type { AccentKey } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { setApiBase, getApiBase } from '../api/client';

const ACCENT_ORDER: AccentKey[] = ['aurora', 'blue', 'cyan', 'green', 'amber', 'pink', 'violet'];

export function ProfileScreen() {
  const navigate = useNavigate();
  const { accent, colors, setAccent } = useTheme();
  const { user, logout } = useAuth();
  const [editingServer, setEditingServer] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBase());

  const saveServerUrl = () => {
    const url = serverUrl.trim();
    if (!url) { alert('地址不能为空'); return; }
    setApiBase(url);
    setEditingServer(false);
    alert('已保存，刷新页面后生效');
  };

  return (
    <div style={{ minHeight: '100vh', padding: 20, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate('/agents')} style={{ background: 'none', border: 'none', color: colors.text, fontSize: 20, cursor: 'pointer', marginRight: 12 }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>我的</h1>
      </div>

      {/* User card */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 20, borderRadius: 18, background: colors.surface, border: `1px solid ${colors.border}`, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: colors.textInverse, marginRight: 14 }}>
          {user?.id || '?'}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>用户 {user?.id || ''}</div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>匿名用户，无需登录</div>
        </div>
      </div>

      {/* Theme */}
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 10, marginLeft: 4 }}>外观</div>
      <div style={{ padding: 16, borderRadius: 16, background: colors.surface, border: `1px solid ${colors.border}`, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>主题色彩</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {ACCENT_ORDER.map((key) => {
            const preset = ACCENTS[key];
            const selected = key === accent;
            return (
              <button key={key} onClick={() => setAccent(key)} style={{
                width: 28, height: 28, borderRadius: '50%', border: selected ? '2.5px solid #fff' : '2px solid transparent',
                background: `linear-gradient(135deg, ${preset.gradient[0]}, ${preset.gradient[1]})`,
                cursor: 'pointer', padding: 0,
              }} />
            );
          })}
        </div>
      </div>

      {/* Server */}
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 10, marginLeft: 4 }}>服务</div>
      {editingServer ? (
        <div style={{ padding: 14, borderRadius: 16, background: colors.surface, border: `1px solid ${colors.border}`, marginBottom: 10 }}>
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: '100%', height: 40, borderRadius: 10, padding: '0 12px',
              border: `1px solid ${colors.border}`, background: colors.inputBackground,
              color: colors.text, fontSize: 14, outline: 'none', marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditingServer(false)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.inputBackground, color: colors.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>取消</button>
            <button onClick={saveServerUrl} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: colors.primary, color: colors.textInverse, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>保存</button>
          </div>
        </div>
      ) : (
        <div onClick={() => setEditingServer(true)} style={{
          display: 'flex', alignItems: 'center', padding: 14, borderRadius: 16,
          background: colors.surface, border: `1px solid ${colors.border}`, marginBottom: 10,
          cursor: 'pointer',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>服务器地址</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{getApiBase()}</div>
          </div>
          <span style={{ color: colors.textSecondary, fontSize: 18 }}>›</span>
        </div>
      )}

      {/* Logout */}
      <button onClick={() => { if (confirm('确定要清除当前设备上的登录信息吗？')) { logout(); navigate('/'); } }} style={{
        width: '100%', height: 48, borderRadius: 16, border: 'none',
        background: colors.danger, color: colors.textInverse,
        fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 20,
      }}>
        清除本地数据
      </button>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: colors.textSecondary }}>灵伴 v1.0.0</div>
    </div>
  );
}
