content = open('src/pages/AdminDashboard.tsx').read()

# 1. Add requirements state after existing state declarations
content = content.replace(
    "const [editListing, setEditListing] = useState<any>(null);",
    "const [editListing, setEditListing] = useState<any>(null);\n  const [requirements, setRequirements] = useState<any[]>([]);"
)

# 2. Add requirements fetch inside fetchAll
content = content.replace(
    "setListings(props || []);",
    """const { data: reqs } = await supabase
      .from("tenant_requirements")
      .select("*")
      .eq("market", "us")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequirements(reqs || []);
    setListings(props || []);"""
)

# 3. Add tab type to include requirements
content = content.replace(
    'const [tab, setTab] = useState<"listings" | "messages" | "users">("listings");',
    'const [tab, setTab] = useState<"listings" | "messages" | "users" | "requirements">("listings");'
)

# 4. Add Requirements to TABS array
content = content.replace(
    '    { key: "users", label: "Users", count: stats.users },\n  ];',
    '    { key: "users", label: "Users", count: stats.users },\n    { key: "requirements", label: "Reqs", count: requirements.length },\n  ];'
)

# 5. Add requirements stat to stats bar
content = content.replace(
    '          { label: "Users", value: stats.users, color: "text-green-400" },',
    '          { label: "Users", value: stats.users, color: "text-green-400" },\n          { label: "Reqs", value: requirements.length, color: "text-purple-400" },'
)

# 6. Fix grid-cols for stats bar (3 -> 4)
content = content.replace(
    'className="grid grid-cols-3 gap-px bg-gray-800"',
    'className="grid grid-cols-4 gap-px bg-gray-800"'
)

# 7. Add requirements tab content before closing </>
content = content.replace(
    "          </>",
    """            {/* REQUIREMENTS */}
            {tab === "requirements" && requirements.map(r => (
              <div key={r.id} className="bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{r.bedrooms ? `${r.bedrooms} BR` : "Any"} · {r.city}</p>
                    <p className="text-orange-400 text-sm font-bold">
                      {r.budget_min && r.budget_max ? `$${r.budget_min}–$${r.budget_max}/mo` : "Budget flexible"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-green-900 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                      {r.status}
                    </span>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this requirement?")) return;
                        await supabase.from("tenant_requirements").delete().eq("id", r.id);
                        setRequirements(prev => prev.filter(x => x.id !== r.id));
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {r.near_university && <p className="text-xs text-gray-400">Near {r.near_university}</p>}
                <p className="text-xs text-gray-500">
                  Move-in: {new Date(r.move_in_date).toLocaleDateString()} · Posted: {new Date(r.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {r.needs_halal_kitchen && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🍳 Halal</span>}
                  {r.needs_prayer_space && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🕌 Prayer</span>}
                  {r.needs_alcohol_free && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🚫 Alcohol Free</span>}
                  {r.near_mosque && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">🕌 Mosque</span>}
                </div>
              </div>
            ))}
          </>""",
    1
)

open('src/pages/AdminDashboard.tsx', 'w').write(content)
print('done')
