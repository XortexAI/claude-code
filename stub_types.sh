#!/bin/bash
# Auto-generate stub types.ts files for all missing modules

cd /Users/vedantmahajan/Desktop/Xortex/claude-code

# Find all directories that need types.ts
find . -name "*.ts" -o -name "*.tsx" | xargs grep -h "from './types.js'" 2>/dev/null | sed "s/.*from '\([^']*\)'.*/\1/" | sort -u | while read path; do
    dir=$(dirname "$path")
    if [ ! -f "$dir/types.ts" ] && [ ! -f "$dir/types.js" ]; then
        echo "// Stub types file for $dir" > "$dir/types.ts"
        echo "Created stub: $dir/types.ts"
    fi
done