#!/usr/bin/env bash
set -euo pipefail

test "$(git hash-object index.html)" = "$(git rev-parse HEAD:index.html)"
git diff --quiet HEAD -- assets/
test -z "$(git ls-files --others --exclude-standard -- assets/)"
echo "root index.html and assets/ are unchanged"
