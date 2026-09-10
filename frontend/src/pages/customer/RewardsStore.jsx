import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

const REWARDS = [
  { id: 'breakfast', icon: '☕', title: 'Free Breakfast Voucher', titleHi: 'मुफ्त नाश्ता वाउचर', titleTe: 'ఉచిత బ్రేక్‌ఫాస్ట్ వోచర్', desc: 'Complimentary breakfast at any partner hotel', cost: 200, color: '#f59e0b' },
  { id: 'discount10', icon: '🏷️', title: '10% Discount Coupon', titleHi: '10% छूट कूपन', titleTe: '10% డిస్కౌంట్ కూపన్', desc: 'Get 10% off your next booking', cost: 500, color: '#6366f1' },
  { id: 'upgrade', icon: '⬆️', title: 'Room Upgrade Voucher', titleHi: 'कमरा अपग्रेड वाउचर', titleTe: 'రూమ్ అప్‌గ్రేడ్ వోచర్', desc: 'Free upgrade to next room category', cost: 800, color: '#ec4899' },
  { id: 'transfer', icon: '🚗', title: 'Airport Transfer', titleHi: 'एयरपोर्ट ट्रांसफर', titleTe: 'ఎయిర్‌పోర్ట్ ట్రాన్స్‌ఫర్', desc: 'Free airport pickup or drop', cost: 600, color: '#0ea5e9' },
  { id: 'spa', icon: '💆', title: 'Spa & Wellness Pass', titleHi: 'स्पा और वेलनेस पास', titleTe: 'స్పా & వెల్‌నెస్ పాస్', desc: '60 min spa session at partner hotels', cost: 1000, color: '#10b981' },
  { id: 'freenight', icon: '🌙', title: 'Free Night Stay', titleHi: 'एक रात मुफ्त ठहराव', titleTe: 'ఉచిత రాత్రి బస', desc: 'One night free at select properties', cost: 1500, color: '#8b5cf6' },
];

export default function RewardsStore() {
  const { user, updateProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { addToast } = useToast();
  const [redemptions, setRedemptions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`hostiq_redemptions_${user?.email}`) || '[]'); } catch { return []; }
  });
  const [redeemingId, setRedeemingId] = useState(null);

  const points = user?.loyalty_points || 0;

  const handleRedeem = (reward) => {
    if (points < reward.cost) {
      addToast(t('notEnoughPoints'), 'error');
      return;
    }
    setRedeemingId(reward.id);
    setTimeout(() => {
      const newPoints = points - reward.cost;
      updateProfile({ loyalty_points: newPoints });

      const entry = {
        id: `r-${Date.now()}`,
        rewardId: reward.id,
        title: reward.title,
        cost: reward.cost,
        icon: reward.icon,
        date: new Date().toISOString(),
      };
      const updated = [entry, ...redemptions];
      setRedemptions(updated);
      try { localStorage.setItem(`hostiq_redemptions_${user?.email}`, JSON.stringify(updated)); } catch {}

      addToast(`${t('redeemed')} ${reward.title} (-${reward.cost} ${t('pts')})`, 'success');
      setRedeemingId(null);
    }, 600);
  };

  const getTitle = (r) => {
    if (lang === 'hi' && r.titleHi) return r.titleHi;
    if (lang === 'te' && r.titleTe) return r.titleTe;
    return r.title;
  };

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Points Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        borderRadius: 20, padding: '36px 40px', color: 'white',
        marginBottom: 32, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, fontWeight: 700, marginBottom: 8 }}>
            {t('yourPoints')}
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
            {points.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 8 }}>
            {t('earnMore')}
          </div>
        </div>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem',
        }}>
          🏆
        </div>
      </div>

      {/* Rewards Grid */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 20px', fontFamily: 'var(--font-sans)' }}>
          {t('redeemableRewards')}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
        {REWARDS.map((reward) => {
          const canAfford = points >= reward.cost;
          const isRedeeming = redeemingId === reward.id;

          return (
            <div key={reward.id} className="slide-up" style={{
              background: 'var(--bg-card, white)', borderRadius: 16,
              border: '1px solid var(--border, #f0f0f5)',
              padding: '24px', transition: 'all 0.2s',
              opacity: canAfford ? 1 : 0.55,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${reward.color}14`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', marginBottom: 16,
              }}>
                {reward.icon}
              </div>

              {/* Title & desc */}
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text, #1e293b)', marginBottom: 4 }}>
                {getTitle(reward)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: 16, lineHeight: 1.5 }}>
                {reward.desc}
              </div>

              {/* Cost & Redeem */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: reward.color }}>
                  {reward.cost} {t('pts')}
                </span>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford || isRedeeming}
                  style={{
                    padding: '7px 18px', borderRadius: 8, border: 'none',
                    background: canAfford ? reward.color : '#e2e8f0',
                    color: canAfford ? 'white' : '#94a3b8',
                    fontSize: '0.78rem', fontWeight: 700, cursor: canAfford ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: isRedeeming ? 0.6 : 1,
                  }}
                >
                  {isRedeeming ? '...' : t('redeem')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Redemption History */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', fontFamily: 'var(--font-sans)' }}>
          {t('redemptionHistory')}
        </h3>

        {redemptions.length === 0 ? (
          <div style={{
            background: 'var(--bg-card, white)', borderRadius: 14, padding: '40px 24px',
            textAlign: 'center', color: 'var(--text-secondary, #94a3b8)',
            border: '1px solid var(--border, #f0f0f5)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>🎁</div>
            <div style={{ fontSize: '0.85rem' }}>{t('noRedemptions')}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {redemptions.map((r) => (
              <div key={r.id} style={{
                background: 'var(--bg-card, white)', borderRadius: 12, padding: '14px 18px',
                border: '1px solid var(--border, #f0f0f5)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text, #1e293b)' }}>{r.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444' }}>
                  -{r.cost} {t('pts')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
