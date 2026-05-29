content = open('src/pages/AdminDashboard.tsx').read()

dupe = """    const { data: reqs } = await supabase
      .from("tenant_requirements")
      .select("*")
      .eq("market", "us")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequirements(reqs || []);
    const { data: reqs } = await supabase
      .from("tenant_requirements")
      .select("*")
      .eq("market", "us")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequirements(reqs || []);"""

single = """    const { data: reqs } = await supabase
      .from("tenant_requirements")
      .select("*")
      .eq("market", "us")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequirements(reqs || []);"""

content = content.replace(dupe, single)
open('src/pages/AdminDashboard.tsx', 'w').write(content)
print('done')
