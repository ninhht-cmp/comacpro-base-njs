#!/bin/bash
# Block agent edits to files that must be changed by tooling or a human.
# Exit code 2 blocks the tool call and surfaces the message to the agent.

set -euo pipefail

input_data=$(cat)
file_path=$(echo "$input_data" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
  exit 0
fi

base=$(basename "$file_path")

# .env.example is the documented template and MUST stay editable; every other
# .env* file holds real secrets.
if [[ "$base" == .env* && "$base" != ".env.example" ]]; then
  echo "Protected file: $file_path — env files hold secrets; edit manually and mirror shape changes in .env.example" >&2
  exit 2
fi

protected_patterns=(
  "pnpm-lock.yaml"    # owned by pnpm — run install/add/remove instead
  ".git/"
  "node_modules/"
  ".next/"
  "coverage/"
  "storybook-static/"
)

for pattern in "${protected_patterns[@]}"; do
  if [[ "$file_path" == *"$pattern"* ]]; then
    echo "Protected file: $file_path — this file is generated or tool-owned; change it through the owning tool" >&2
    exit 2
  fi
done

exit 0
