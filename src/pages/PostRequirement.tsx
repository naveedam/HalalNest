import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

interface FormData {
  city: string;
  near_university: string;
  move_in_date: string;
  bedrooms: number | null;
  budget_min: number | null;
  budget_max: number | null;
  property_type: 'apartment' | 'house' | 'pg' | 'any';
  gender_preference: 'any' | 'male_only' | 'female_only';
  description: string;
  needs_halal_kitchen: boolean;
  needs_prayer_space: boolean;
  needs_alcohol_free: boolean;
  near_mosque: boolean;
}

const INITIAL: FormData = {
  city: '', near_university: '', move_in_date: '',
  bedrooms: null, budget_min: null, budget_max: null,
  property_type: 'any', gender_preference: 'any', description: '',
  needs_halal_kitchen: false, needs_prayer_space: false,
  needs_alcohol_free: false, near_mosque: false,
};

const STEPS = ['Property', 'Pricing', 'Muslim-Friendly'];

function PillGroup<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14,
            fontWeight: 500, cursor: 'pointer', border: '1px solid',
            borderColor: value === opt.value ? 'transparent' : '#3a3d46',
            background: value === opt.value ? '#e65c00' : '#2a2d35',
            color: value === opt.value ? '#fff' : '#9ca3af',
            minWidth: 80,
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleCard({ icon, label, checked, onChange }: {
  icon: string; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: 8, border: '1px solid',
        borderColor: checked ? '#e65c00' : '#3a3d46',
        background: checked ? 'rgba(230,92,0,0.1)' : '#2a2d35',
        color: checked ? '#e65c00' : '#9ca3af',
        fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%',
        textAlign: 'left',
      }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', border: '1px solid',
        borderColor: checked ? '#e65c00' : '#4b5563',
        background: checked ? '#e65c00' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: '#fff', flexShrink: 0,
      }}>
        {checked ? '✓' : ''}
      </span>
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1e2128', border: '1px solid #3a3d46',
  borderRadius: 8, padding: '10px 14px', color: '#f9fafb', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: 500,
};

export default function PostRequirement({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<FormData>) => setForm(prev => ({ ...prev, ...patch }));

  const budgetInvalid = !!(form.budget_min && form.budget_max && form.budget_max < form.budget_min);

  const canProceed = () => {
    if (step === 0) return form.city.trim() !== '' && form.move_in_date !== '';
    if (step === 1) return !budgetInvalid;
    return true;
  };

  const handleSubmit = async () => {
    if (authLoading) { return; }
    if (!user) { onClose(); onSignIn(); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.from('tenant_requirements').insert({
      tenant_id: user.id,
      market: 'us',
      city: form.city.trim(),
      near_university: form.near_university.trim() || null,
      move_in_date: form.move_in_date,
      bedrooms: form.bedrooms,
      budget_min: form.budget_min,
      budget_max: form.budget_max,
      property_type: form.property_type,
      gender_preference: form.gender_preference,
      description: form.description.trim() || null,
      needs_halal_kitchen: form.needs_halal_kitchen,
      needs_prayer_space: form.needs_prayer_space,
      needs_alcohol_free: form.needs_alcohol_free,
      near_mosque: form.near_mosque,
      status: 'active',
    });
    setLoading(false);
    if (err) { console.error('Insert error:', err); setError(err.message); return; }
    console.log('Insert success');
    alert('Your requirement has been posted! Landlords with matching properties will reach out.');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 600, background: '#16181f',
        border: '1px solid #2a2d35', borderRadius: 16,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f9fafb', margin: 0 }}>
            Post Your Requirements
          </h2>
          <button onClick={() => onClose()} style={{
            background: 'none', border: 'none', color: '#9ca3af',
            fontSize: 20, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Step tabs — matches listing wizard style */}
        <div style={{ display: 'flex', padding: '16px 24px 0', gap: 0, borderBottom: '1px solid #2a2d35' }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'default',
              color: i === step ? '#e65c00' : i < step ? '#6b7280' : '#6b7280',
              borderBottom: i === step ? '2px solid #e65c00' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* ── Step 0: Where & When ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input style={inputStyle} value={form.city}
                  onChange={e => set({ city: e.target.value })}
                  placeholder="e.g. Ann Arbor, MI" />
              </div>
              <div>
                <label style={labelStyle}>Nearest University</label>
                <input style={inputStyle} value={form.near_university}
                  onChange={e => set({ near_university: e.target.value })}
                  placeholder="e.g. University of Michigan, NYU, UCLA" />
              </div>
              <div>
                <label style={labelStyle}>Move-in Date *</label>
                <input type="date" style={inputStyle} value={form.move_in_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => set({ move_in_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Gender Preference</label>
                <PillGroup
                  options={[
                    { label: 'Any', value: 'any' },
                    { label: 'Male Only', value: 'male_only' },
                    { label: 'Female Only', value: 'female_only' },
                  ]}
                  value={form.gender_preference}
                  onChange={v => set({ gender_preference: v })}
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Property Needs ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Property Type</label>
                <PillGroup
                  options={[
                    { label: 'Any', value: 'any' },
                    { label: 'Apartment', value: 'apartment' },
                    { label: 'House', value: 'house' },
                    { label: 'PG', value: 'pg' },
                  ]}
                  value={form.property_type}
                  onChange={v => set({ property_type: v })}
                />
              </div>
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <PillGroup
                  options={[
                    { label: '1 BR', value: '1' as any },
                    { label: '2 BR', value: '2' as any },
                    { label: '3 BR', value: '3' as any },
                    { label: '4 BR', value: '4' as any },
                  ]}
                  value={String(form.bedrooms ?? '') as any}
                  onChange={v => set({ bedrooms: v ? Number(v) : null })}
                />
              </div>
              <div>
                <label style={labelStyle}>Monthly Budget (USD)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="number" style={inputStyle} value={form.budget_min ?? ''}
                    onChange={e => set({ budget_min: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Min" />
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>–</span>
                  <input type="number" style={inputStyle} value={form.budget_max ?? ''}
                    onChange={e => set({ budget_max: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Max" />
                </div>
                {budgetInvalid && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>Max must be ≥ min</p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Additional Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.description} rows={3}
                  onChange={e => set({ description: e.target.value })}
                  placeholder="Anything else landlords should know..." />
              </div>
            </div>
          )}

          {/* ── Step 2: Muslim-Friendly ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
                Select what matters to you. Landlords with matching properties will reach out directly.
              </p>
              <ToggleCard icon="🍳" label="Halal Kitchen"
                checked={form.needs_halal_kitchen} onChange={v => set({ needs_halal_kitchen: v })} />
              <ToggleCard icon="🕌" label="Prayer Space"
                checked={form.needs_prayer_space} onChange={v => set({ needs_prayer_space: v })} />
              <ToggleCard icon="🚫" label="Alcohol Free"
                checked={form.needs_alcohol_free} onChange={v => set({ needs_alcohol_free: v })} />
              <ToggleCard icon="🕌" label="Near Mosque"
                checked={form.near_mosque} onChange={v => set({ near_mosque: v })} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, background: '#3b1515', border: '1px solid #7f1d1d',
              borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            <button type="button"
              onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
              style={{
                background: 'none', border: 'none', color: '#9ca3af',
                fontSize: 14, cursor: 'pointer', padding: '10px 0',
              }}>
              Cancel
            </button>
            {step < 2 ? (
              <button type="button" disabled={!canProceed()}
                onClick={() => setStep(s => s + 1)}
                style={{
                  background: canProceed() ? '#e65c00' : '#3a2010',
                  color: canProceed() ? '#fff' : '#6b7280',
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  fontSize: 14, fontWeight: 600,
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                }}>
                Next →
              </button>
            ) : (
              <button type="button" disabled={loading} onClick={handleSubmit}
                style={{
                  background: loading ? '#3a2010' : '#e65c00',
                  color: loading ? '#6b7280' : '#fff',
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? 'Posting...' : 'Post →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
