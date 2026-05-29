content = open('src/pages/PostRequirement.tsx').read()
content = content.replace(
    "if (authLoading) { setError('Please wait...'); return; }\n    if (!user) { setError('Please sign in to post your requirements.'); return; }",
    "if (authLoading) { return; }\n    if (!user) { onClose(); onSignIn(); return; }"
)
open('src/pages/PostRequirement.tsx', 'w').write(content)
print('done')
