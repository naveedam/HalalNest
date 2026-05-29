content = open('src/pages/PostRequirement.tsx').read()

content = content.replace(
    "if (authLoading) { return; }\n    if (!user) { setError('Please sign in to post your requirements.'); return; }",
    "if (authLoading) { return; }\n    if (!user) { onClose(); onSignIn(); return; }"
)

open('src/pages/PostRequirement.tsx', 'w').write(content)

lines = open('src/pages/PostRequirement.tsx').readlines()
for i, line in enumerate(lines, 1):
    if any(x in line for x in ['onSignIn', 'onClose', 'authLoading', 'Please']):
        print(f"{i}: {line.rstrip()}")
