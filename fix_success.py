content = open('src/pages/PostRequirement.tsx').read()
content = content.replace(
    "console.log('Insert success');\n    onClose();",
    "console.log('Insert success');\n    alert('Your requirement has been posted! Landlords with matching properties will reach out.');\n    onClose();"
)
open('src/pages/PostRequirement.tsx', 'w').write(content)
print('done')
