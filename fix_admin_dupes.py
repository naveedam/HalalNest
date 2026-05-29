content = open('src/pages/AdminDashboard.tsx').read()

# Remove duplicate state declaration
content = content.replace(
    "  const [requirements, setRequirements] = useState<any[]>([]);\n  const [requirements, setRequirements] = useState<any[]>([]);",
    "  const [requirements, setRequirements] = useState<any[]>([]);"
)

# Remove duplicate fetch block - keep only the first setRequirements + fetch
content = content.replace(
    "    setRequirements(reqs || []);\n      const { data: reqs } = await supabase\n        .from(\"tenant_requirements\")\n        .select(\"*\")\n        .eq(\"market\", \"us\")\n        .order(\"created_at\", { ascending: false })\n        .limit(100);",
    "    setRequirements(reqs || []);"
)

open('src/pages/AdminDashboard.tsx', 'w').write(content)
print('done')
