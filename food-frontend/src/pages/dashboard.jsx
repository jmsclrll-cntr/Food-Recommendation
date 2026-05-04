import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Droplet, 
  Leaf, 
  Activity, 
  LogOut, 
  ChevronRight, 
  FlaskConical,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const tokens = {
  font: {
    serif: `'Cormorant Garamond', 'Garamond', Georgia, serif`,
    sans: `'DM Sans', 'Helvetica Neue', sans-serif`,
    mono: `'DM Mono', monospace`,
  },
};

// ─── KEYFRAMES (injected once) ────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --sage:       #8FAF7E;
    --sage-light: #B8CFAA;
    --sage-dim:   #6A8A5A;
    --dark:       #1A1F18;
    --dark-mid:   #242920;
    --parchment:  #F3F0EA;
    --cream:      #FAF8F4;
    --gold:       #C9A96E;
    --gold-dim:   rgba(201,169,110,0.18);
    --shadow-xl:  0 32px 80px -16px rgba(26,31,24,0.28);
    --shadow-lg:  0 16px 48px -8px rgba(26,31,24,0.18);
    --shadow-sm:  0 4px 20px rgba(26,31,24,0.08);
    --radius-card: 28px;
    --radius-pill: 100px;
    --radius-sm:   12px;
    --border-sage: 1px solid rgba(143,175,126,0.18);
    --border-gold: 1px solid rgba(201,169,110,0.22);
  }

  .dark-mode {
    --parchment:  #0F110E;
    --cream:      #1A1F18;
    --dark:       #F3F0EA;
    --dark-mid:   #121611;
    --gold-dim:   rgba(201,169,110,0.1);
    --border-sage: 1px solid rgba(143,175,126,0.12);
    --shadow-xl:  0 32px 80px -16px rgba(0,0,0,0.5);
  }

  .dark-mode .protocols-card {
    background: #141812;
    border-color: rgba(143,175,126,0.1);
  }

  .dark-mode .stat-label { color: rgba(255,255,255,0.4); }
  .dark-mode .stat-sub { color: rgba(255,255,255,0.2); }
  .dark-mode .history-link:hover { color: #fff; }
  .dark-mode .history-link:hover .line { background: #fff; }
  .dark-mode .section-label { color: var(--sage); opacity: 0.8; }

  html, body { height: 100%; overflow: hidden; }

  .db-root {
    height: 100dvh;
    overflow: hidden;
    background: var(--parchment);
    background-image:
      radial-gradient(ellipse 80% 50% at 15% 20%, rgba(143,175,126,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 70% at 85% 80%, rgba(201,169,110,0.05) 0%, transparent 60%);
    font-family: ${tokens.font.sans};
    color: var(--dark);
    -webkit-font-smoothing: antialiased;
    transition: background 0.5s ease, color 0.5s ease;
  }

  .profile-card {
    background: var(--cream);
    border: var(--border-sage);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.05);
    overflow: hidden;
    position: relative;
    transition: background 0.5s ease;
  }
  .profile-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 40% at 70% 0%, rgba(143,175,126,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .avatar-wrap {
    position: relative;
    width: 100px; height: 100px;
    flex-shrink: 0;
  }
  .avatar-wrap::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, var(--sage-light), var(--gold), transparent, var(--sage-light));
    animation: spin 10s linear infinite;
    z-index: 0;
  }
  .avatar-wrap::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 50%;
    background: var(--cream);
    z-index: 1;
    transition: background 0.5s ease;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .avatar-wrap img {
    position: relative;
    z-index: 2;
    width: 100%; height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .stat-divider {
    width: 1px;
    height: 36px;
    background: linear-gradient(to bottom, transparent, rgba(143,175,126,0.25), transparent);
    align-self: center;
  }

  .stat-label {
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-weight: 600;
    color: rgba(26,31,24,0.35);
    margin-bottom: 4px;
    transition: color 0.3s ease;
  }
  .stat-value {
    font-family: ${tokens.font.serif};
    font-size: 32px;
    font-weight: 400;
    line-height: 1;
    color: var(--dark);
  }
  .stat-sub {
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(26,31,24,0.22);
    margin-top: 4px;
  }

  .target-card {
    background: var(--dark-mid);
    border-radius: var(--radius-card);
    border: 1px solid rgba(143,175,126,0.12);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    position: relative;
    flex: 1;
  }
  .target-card-bg {
    position: absolute; inset: 0;
    background-image: url('https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=1000');
    background-size: cover;
    background-position: center;
    opacity: 0.06;
    filter: grayscale(1);
    transition: transform 4s ease;
  }
  .target-card:hover .target-card-bg { transform: scale(1.06); }
  .target-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(143,175,126,0.07) 0%, transparent 50%, rgba(201,169,110,0.04) 100%);
    pointer-events: none;
  }

  .hydration-bar-bg {
    width: 100%; height: 2px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 14px;
  }
  .hydration-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(143,175,126,0.6), var(--sage-light));
    border-radius: 2px;
  }

  .logout-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background 0.3s, border-color 0.3s;
  }
  .logout-btn:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); }
  .logout-btn span {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    font-family: ${tokens.font.sans};
    transition: color 0.3s;
  }
  .logout-btn:hover span { color: rgba(255,255,255,0.55); }
  .logout-btn svg { color: rgba(255,255,255,0.18); transition: all 0.3s; }
  .logout-btn:hover svg { color: rgba(255,255,255,0.5); transform: translateX(3px); }

  .banner {
    border-radius: var(--radius-card);
    overflow: hidden;
    position: relative;
    box-shadow: var(--shadow-xl);
    cursor: default;
  }
  .banner-img {
    position: absolute; inset: 0;
    background-image: url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2000');
    background-size: cover;
    background-position: center 40%;
    transition: transform 5s ease;
  }
  .banner:hover .banner-img { transform: scale(1.04); }
  .banner-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(100deg, rgba(26,31,24,0.88) 0%, rgba(26,31,24,0.55) 50%, transparent 80%);
  }
  .banner-top-line {
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(143,175,126,0.4), rgba(201,169,110,0.2), transparent);
  }

  .pill {
    display: inline-flex; align-items: center;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    font-size: 9px; font-weight: 600; letter-spacing: 0.45em; text-transform: uppercase;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(143,175,126,0.25);
    background: rgba(143,175,126,0.1);
    color: rgba(184,207,170,0.9);
  }

  .plan-btn {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 14px 28px;
    background: var(--cream);
    color: var(--dark);
    border: none; border-radius: var(--radius-sm);
    font-size: 9px; font-weight: 700; letter-spacing: 0.4em; text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 16px 48px rgba(0,0,0,0.25);
    transition: background 0.4s, color 0.4s, transform 0.25s;
    font-family: ${tokens.font.sans};
  }
  .plan-btn:hover { background: var(--sage); color: #fff; transform: translateY(-2px); }
  .plan-btn:hover svg { transform: translateX(3px); }
  .plan-btn svg { transition: transform 0.3s; }

  .protocols-card {
    background: #EEF2E8;
    border: 1px solid rgba(143,175,126,0.22);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.6);
    overflow: hidden;
    transition: background 0.5s ease;
  }

  .icon-chip {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(143,175,126,0.1);
    border: 1px solid rgba(143,175,126,0.18);
    flex-shrink: 0;
  }

  ::-webkit-scrollbar { display: none; }

  .verified-badge {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(143,175,126,0.7);
    background: rgba(143,175,126,0.08);
    border: 1px solid rgba(143,175,126,0.14);
    padding: 5px 14px; border-radius: var(--radius-pill);
  }

  .section-label {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(143,175,126,0.65);
  }

  .history-link {
    display: flex; align-items: center; gap: 8px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(143,175,126,0.5);
    cursor: pointer;
    transition: color 0.3s;
    background: none; border: none;
  }
  .history-link:hover { color: var(--dark); }
  .history-link .line {
    width: 20px; height: 1px;
    background: rgba(143,175,126,0.3);
    transition: width 0.3s, background 0.3s;
  }
  .history-link:hover .line { width: 36px; background: var(--dark); }

  .theme-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(143,175,126,0.1);
    border: 1px solid rgba(143,175,126,0.15);
    width: 34px; height: 34px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--sage);
    transition: all 0.3s ease;
    z-index: 10;
  }
  .theme-toggle:hover {
    background: var(--sage);
    color: #fff;
    transform: translateY(-1px);
  }

  .serif-title {
    font-family: ${tokens.font.serif};
    font-weight: 400;
    color: var(--dark);
  }

  .gold-line {
    height: 1px;
    background: linear-gradient(90deg, var(--gold-dim) 0%, rgba(201,169,110,0.04) 100%);
  }
`;

const Stat = ({ label, value, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
    <p className="stat-sub">{subtitle}</p>
  </div>
);

const DonutRing = ({ pct, size = 110, stroke = 9, color = 'var(--sage)', trackColor = 'rgba(143,175,126,0.12)', children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
};

const MacroDonut = ({ label, value, total, unit, pct, color, trackColor = 'rgba(143,175,126,0.13)', delay = 0.5 }) => {
  const size = 90;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
        color: 'rgba(143,175,126,0.5)',
      }}>{label}</p>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <motion.circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - circ * pct }}
            transition={{ duration: 1.5, delay, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
      </div>
      <p style={{ lineHeight: 1, textAlign: 'center' }}>
        <span style={{
          fontFamily: tokens.font.serif, fontSize: 28, fontWeight: 400,
          color: 'var(--dark)',
        }}>{value}</span>
        <span style={{
          fontFamily: tokens.font.sans, fontSize: 13, fontWeight: 400,
          color: 'rgba(143,175,126,0.4)', marginLeft: 2,
        }}>/{total}{unit}</span>
      </p>
    </div>
  );
};

const Dashboard = () => {
  const [user] = useState(() => {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  });

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  if (!user) return null;

  return (
    <>
      <style>{globalStyles}</style>

      <div className={`db-root ${isDark ? 'dark-mode' : ''}`} style={{ display: 'flex', alignItems: 'stretch', padding: '16px', gap: 14 }}>

        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width: 320, flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          <div className="profile-card" style={{ padding: '32px 28px' }}>
            
            <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* ── UPDATED LEAF VISIBILITY ── */}
            <Leaf style={{
              position: 'absolute', top: 20, left: 22,
              width: 24, height: 24, 
              color: 'rgba(143,175,126,0.9)', // High visibility green
              transform: 'rotate(15deg)',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div className="avatar-wrap">
                <img
                  src={user.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500'}
                  alt="Profile"
                />
              </div>

              <span className="verified-badge">Verified Profile</span>

              <h2 style={{
                fontFamily: tokens.font.serif,
                fontSize: 28, fontWeight: 400,
                color: 'var(--dark)', letterSpacing: '-0.01em',
                textAlign: 'center',
              }}>{user.username}</h2>
            </div>

            <div className="gold-line" style={{ margin: '22px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
              <Stat label="Goal" value="92%" subtitle="Adherence" />
              <div className="stat-divider" />
              <Stat label="Streak" value="14d" subtitle="Consistency" />
            </div>
          </div>

          <div className="target-card" style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="target-card-bg" />
            <div className="target-card-overlay" />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <p className="section-label" style={{ color: 'rgba(184,207,170,0.6)', marginBottom: 10 }}>Target Focus</p>
                  <h3 style={{
                    fontFamily: tokens.font.serif,
                    fontSize: 24, fontWeight: 300,
                    color: '#fff', lineHeight: 1.3, letterSpacing: '0.01em',
                  }}>
                    Nourishment &<br />
                    <em style={{ fontStyle: 'italic', color: 'rgba(184,207,170,0.85)' }}>Cellular</em> Repair
                  </h3>
                </div>
                <div className="icon-chip">
                  <FlaskConical style={{ width: 15, height: 15, color: 'rgba(143,175,126,0.55)' }} />
                </div>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18, padding: '18px 20px',
                marginBottom: 10,
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="icon-chip" style={{ width: 26, height: 26, borderRadius: 8 }}>
                      <Droplet style={{ width: 12, height: 12, color: 'var(--sage)' }} />
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: 'rgba(143,175,126,0.6)',
                    }}>Hydration Level</span>
                  </div>
                  <span style={{
                    fontFamily: tokens.font.serif,
                    fontSize: 20, fontWeight: 400, color: '#fff',
                  }}>
                    2.4 <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>/ 3L</span>
                  </span>
                </div>
                <div className="hydration-bar-bg">
                  <motion.div
                    className="hydration-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </div>

              <button
                className="logout-btn"
                onClick={() => { localStorage.clear(); navigate('/'); }}
              >
                <span>End Session</span>
                <LogOut style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </motion.aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          <motion.div
            className="banner"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            style={{ flex: '0 0 auto', minHeight: 260 }}
          >
            <div className="banner-img" />
            <div className="banner-overlay" />
            <div className="banner-top-line" />

            <div style={{
              position: 'relative', zIndex: 2,
              padding: '44px 52px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              minHeight: 260,
            }}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
              >
                <motion.span
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="pill"
                  style={{ marginBottom: 20, display: 'inline-flex' }}
                >
                  <Sparkles style={{ width: 10, height: 10, marginRight: 6, color: 'rgba(201,169,110,0.7)' }} />
                  Curated Nutrients
                </motion.span>

                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                  style={{
                    fontFamily: tokens.font.serif,
                    fontSize: 'clamp(40px, 4.5vw, 62px)',
                    fontWeight: 300,
                    color: '#fff',
                    lineHeight: 0.9,
                    letterSpacing: '-0.01em',
                    marginBottom: 30,
                  }}
                >
                  <motion.span
                    style={{ display: 'block', marginBottom: 4 }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Sophisticated</span>
                  </motion.span>

                  <motion.em
                    style={{ fontStyle: 'italic', display: 'inline-block' }}
                    animate={{ color: ['#B8CFAA', '#C9A96E', '#B8CFAA'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  >
                    organic
                  </motion.em>

                  <motion.span
                    style={{ marginLeft: 14, display: 'inline-block' }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  >
                    wellness.
                  </motion.span>
                </motion.h1>

                <motion.div
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <button className="plan-btn" onClick={() => navigate('/generate-weekly')}>
                    Plan Weekly
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="protocols-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '28px 30px' }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              marginBottom: 20,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="icon-chip">
                    <Activity style={{ width: 13, height: 13, color: 'var(--sage)' }} />
                  </div>
                  <span className="section-label">Progression</span>
                </div>
                <h4 className="serif-title" style={{ fontSize: 26 }}>Calorie Progress</h4>
              </div>
              <button className="history-link">
                <span>see full history</span>
                <div className="line" />
              </button>
            </div>

            <div className="gold-line" style={{ marginBottom: 18 }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(143,175,126,0.055)',
                border: '1px solid rgba(143,175,126,0.12)',
                borderRadius: 20, padding: '22px 28px',
              }}>
                <div>
                  <p style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
                    color: 'rgba(143,175,126,0.5)', marginBottom: 6,
                  }}>Calories left</p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    style={{
                      fontFamily: tokens.font.serif, fontSize: 52, fontWeight: 400,
                      color: 'var(--dark)', lineHeight: 1, letterSpacing: '-0.02em',
                    }}
                  >1450</motion.p>
                  <p style={{
                    fontSize: 12, fontWeight: 500, color: 'var(--sage-dim)',
                    marginTop: 6, letterSpacing: '0.02em',
                  }}>
                    of <span style={{ color: 'var(--sage)' }}>1800 kcal</span>
                  </p>
                </div>

                <DonutRing pct={0.806} size={108} stroke={8} color="var(--sage)" trackColor="rgba(143,175,126,0.12)">
                  <span style={{ fontSize: 22 }}>🔥</span>
                </DonutRing>
              </div>

              <div className="gold-line" />

              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                <MacroDonut label="Protein" value="67 " total="120" unit="g" pct={0.575} color="#c0ae47" trackColor="rgba(201,169,110,0.15)" delay={0.6} />
                <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(143,175,126,0.14)', margin: '8px 0' }} />
                <MacroDonut label="Fats" value="34" total="45" unit="g" pct={0.756} color="#8FAF7E" trackColor="rgba(143,175,126,0.15)" delay={0.75} />
                <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(143,175,126,0.14)', margin: '8px 0' }} />
                <MacroDonut label="Carbs" value="77" total="200" unit="g" pct={0.385} color="#4c6340" trackColor="rgba(106,138,90,0.13)" delay={0.9} />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;