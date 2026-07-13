#!/bin/bash
# Backstop for the settings.json deny rules: block force pushes even when the
# command is phrased in a way the permission matcher misses.

set -euo pipefail

input_data=$(cat)
cmd=$(echo "$input_data" | jq -r '.tool_input.command // empty')

if [[ -z "$cmd" ]]; then
  exit 0
fi

# Match -f / --force / --force-with-lease as standalone flags after `git push`.
if [[ "$cmd" =~ git\ push.*\ (-f|--force|--force-with-lease)(\ |$) ]]; then
  echo "Force push is not allowed" >&2
  exit 2
fi

exit 0
