content = open('src/App.tsx').read()
content = content.replace(
    """            {user && (
              <button onClick={() => setPostRequirementOpen(true)}
                className="border border-gray-600 hover:border-gray-400 w-full py-3 rounded font-semibold text-gray-300 hover:text-white text-sm">
                📋 Post your requirements
              </button>
            )}""",
    """            <button onClick={() => setPostRequirementOpen(true)}
              className="border border-gray-600 hover:border-gray-400 w-full py-3 rounded font-semibold text-gray-300 hover:text-white text-sm">
              📋 Post your requirements
            </button>"""
)
open('src/App.tsx', 'w').write(content)
print('done')
