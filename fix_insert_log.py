content = open('src/pages/PostRequirement.tsx').read()
content = content.replace(
    "if (err) { setError(err.message); return; }",
    "if (err) { console.error('Insert error:', err); setError(err.message); return; }\n    console.log('Insert success');"
)
open('src/pages/PostRequirement.tsx', 'w').write(content)
print('done')
