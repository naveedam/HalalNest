content = open('src/pages/PostRequirement.tsx').read()
old = "if (!user) { setError('Please sign in to post your requirements.'); return; }"
new = "if (authLoading) { setError('Please wait...'); return; }\n    if (!user) { setError('Please sign in to post your requirements.'); return; }"
content = content.replace(old, new)
open('src/pages/PostRequirement.tsx', 'w').write(content)
print('done')
