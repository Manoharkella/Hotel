import { useState } from 'react';
import { Coffee, Tag, ArrowUpRight, Car, Sparkles, Moon, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

const REWARDS = [
  { id: 'breakfast', icon: Coffee, title: 'Free Breakfast Voucher', titleHi: 'मुफ्त नाश्ता वाउचर', titleTe: 'ఉచిత బ్రేక్‌ఫాస్ట్ వోచర్', desc: 'Complimentary breakfast at any partner hotel', cost: 200, color: '#f59e0b' },
  { id: 'discount10', icon: Tag, title: '10% Discount Coupon', titleHi: '10% छूट कूपन', titleTe: '10% డిస్కౌంట్ కూపన్', desc: 'Get 10% off your next booking', cost: 500, color: '#6366f1' },
  { id: 'upgrade', icon: ArrowUpRight, title: 'Room Upgrade Voucher', titleHi: 'कमरा अपग्रेड वाउचर', titleTe: 'రూమ్ అప్‌గ్రేడ్ వోచర్', desc: 'Free upgrade to next room category', cost: 800, color: '#ec4899' },
  { id: 'transfer', icon: Car, title: 'Airport Transfer', titleHi: 'एयरपोर्ट ट्रांसफर', titleTe: 'ఎయిర్‌పోర్ట్ ట్రాన్స్‌ఫర్', desc: 'Free airport pickup or drop', cost: 600, color: '#0ea5e9' },
  { id: 'spa', icon: Sparkles, title: 'Spa & Wellness Pass', titleHi: 'स्पा और वेलनेस पास', titleTe: 'స్పా & వెల్‌నెస్ పాస్', desc: '60 min spa session at partner hotels', cost: 1000, color: '#10b981' },
  { id: 'freenight', icon: Moon, title: 'Free Night Stay', titleHi: 'एक रात मुफ्त ठहराव', titleTe: 'ఉచిత రాత్రి బస', desc: 'One night free at select properties', cost: 1500, color: '#8b5cf6' },
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
        redeemedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        code: `HOSTIQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };

      const updated = [entry, ...redemptions];
      setRedemptions(updated);
      try { localStorage.setItem(`hostiq_redemptions_${user?.email}`, JSON.stringify(updated)); } catch {}

      setRedeemingId(null);
      addToast(`🎉 ${reward.title} ${t('redeemed')}!`, 'success');
    }, 1000);
  };

  const getTitle = (r) => {
    if (lang === 'hi' && r.titleHi) return r.titleHi;
    if (lang === 'te' && r.titleTe) return r.titleTe;
    return r.title;
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero Points Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
        borderRadius: 24, padding: '32px 36px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 32, position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(15,23,42,0.3)',
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 6 }}>
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
          color: '#F59E0B'
        }}>
          <Award size={40} />
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
          const IconComp = reward.icon;
          const canAfford = points >= reward.cost;
          const isRedeeming = redeemingId === reward.id;

          return (
            <div key={reward.id} style={{
              background: 'var(--card-bg, white)', borderRadius: 20, padding: 20,
              border: '1px solid var(--border-light, #f0f0f5)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${reward.color}15`, color: reward.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <IconComp size={24} />
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
