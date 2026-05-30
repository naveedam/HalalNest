import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ChatModal from "@/modules/chat/ChatModal";
import ChatModal from "@/modules/chat/ChatModal";

interface Requirement {
  id: string;
  city: string;
  near_university: string | null;
  move_in_date: string;
  bedrooms: number | null;
  budget_min: number | null;
  budget_max: number | null;
  property_type: string;
  gender_preference: string;
  needs_halal_kitchen: boolean;
  needs_prayer_space: boolean;
  needs_alcohol_free: boolean;
  near_mosque: boolean;
  description: string | null;
  created_at: string;
  expires_at: string;
  tenant_id: string;
}

export default function TenantBoard({ onClose, onOpenChat }: {
  onClose: () => void;
  onOpenChat?: (tenantId: string) => void;
}) {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatTarget, setChatTarget] = useState<{ tenantId: string } | null>(null);
  const [chatTarget, setChatTarget] = useState<{ tenantId: string } | null>(null);
  const [filter, setFilter] = useState({
    city: "",
    bedrooms: "" as string,
    halal: false,
    prayer: false,
    alcohol_free: false,
    mosque: false,
  });

  useEffect(() => { fetchRequirements(); }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_requirements")
      .select("*")
      .eq("market", "us")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (!error) setRequirements(data || []);
    setLoading(false);
  };

  const filtered = requirements.filter(r => {
    if (filter.city && !r.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
    if (filter.bedrooms && r.bedrooms !== Number(filter.bedrooms)) return false;
    if (filter.halal && !r.needs_halal_kitchen) return false;
    if (filter.prayer && !r.needs_prayer_space) return false;
    if (filter.alcohol_free && !r.needs_alcohol_free) return false;
    if (filter.mosque && !r.near_mosque) return false;
    return true;
  });

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Budget flexible";
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}/mo`;
    if (min) return `From $${min.toLocaleString()}/mo`;
    return `Up to $${max!.toLocaleString()}/mo`;
  };

  const daysLeft = (expires_at: string) => {
    const diff = new Date(expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active ? "bg-orange-500 border-orange-500 text-white" : "bg-transparent border-gray-600 text-gray-400 hover:border-gray-400"
    }`}>
      {label}
    </button>
  );

  return (
    <>
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="font-bold text-lg">📋 Tenant Requirements</h1>
          <p className="text-xs text-gray-400">{filtered.length} active {filtered.length === 1 ? "post" : "posts"}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-800 space-y-3 bg-gray-900">
        <input
          type="text"
          placeholder="Filter by city..."
          value={filter.city}
          onChange={e => setFilter(f => ({ ...f, city: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
        />
        <div className="flex gap-2 flex-wrap">
          {["1","2","3","4"].map(n => (
            <FilterPill key={n} label={`${n} BR`}
              active={filter.bedrooms === n}
              onClick={() => setFilter(f => ({ ...f, bedrooms: f.bedrooms === n ? "" : n }))}
            />
          ))}
          <div className="w-px bg-gray-700 mx-1" />
          <FilterPill label="🍳 Halal Kitchen" active={filter.halal} onClick={() => setFilter(f => ({ ...f, halal: !f.halal }))} />
          <FilterPill label="🕌 Prayer Space" active={filter.prayer} onClick={() => setFilter(f => ({ ...f, prayer: !f.prayer }))} />
          <FilterPill label="🚫 Alcohol Free" active={filter.alcohol_free} onClick={() => setFilter(f => ({ ...f, alcohol_free: !f.alcohol_free }))} />
          <FilterPill label="🕌 Near Mosque" active={filter.mosque} onClick={() => setFilter(f => ({ ...f, mosque: !f.mosque }))} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400">No requirements match your filters</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="bg-gray-800 rounded-xl p-4 space-y-3">

              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">
                    {r.bedrooms ? `${r.bedrooms} BR` : "Any size"} · {r.property_type === "any" ? "Any type" : r.property_type.charAt(0).toUpperCase() + r.property_type.slice(1)}
                  </p>
                  <p className="text-orange-400 font-bold text-sm mt-0.5">{formatBudget(r.budget_min, r.budget_max)}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{daysLeft(r.expires_at)}d left</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <span>📍</span>
                <span>{r.city}</span>
                {r.near_university && <span className="text-gray-500">· near {r.near_university}</span>}
              </div>

              {/* Move-in */}
              <div className="text-xs text-gray-400">
                Move-in: <span className="text-gray-200">{new Date(r.move_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {r.gender_preference !== "any" && (
                  <span className="ml-3">· {r.gender_preference === "male_only" ? "Male only" : "Female only"}</span>
                )}
              </div>

              {/* Muslim-friendly badges */}
              {(r.needs_halal_kitchen || r.needs_prayer_space || r.needs_alcohol_free || r.near_mosque) && (
                <div className="flex gap-1.5 flex-wrap">
                  {r.needs_halal_kitchen && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🍳 Halal Kitchen</span>}
                  {r.needs_prayer_space && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🕌 Prayer Space</span>}
                  {r.needs_alcohol_free && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🚫 Alcohol Free</span>}
                  {r.near_mosque && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🕌 Near Mosque</span>}
                </div>
              )}

              {/* Notes */}
              {r.description && (
                <p className="text-xs text-gray-400 italic">"{r.description}"</p>
              )}

              {/* CTA */}
              {user && user.id !== r.tenant_id && (
                <button
                  onClick={() => { setChatTarget({ tenantId: r.tenant_id }); }}
                  className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
                >
                  I have a match →
                </button>
              )}
              {!user && (
                <p className="text-xs text-center text-gray-500">Sign in to contact this tenant</p>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );

      {/* Direct chat with tenant from TenantBoard */}
      {chatTarget && user && (
        <ChatModal
          propertyId={[user.id, chatTarget.tenantId].sort().join("_req_")}
          propertyTitle="Tenant Match"
          receiverId={chatTarget.tenantId}
          onClose={() => setChatTarget(null)}
          isDirectChat={true}
          chatTitle="Tenant Match"
        />
      )}
    </>
  );
}