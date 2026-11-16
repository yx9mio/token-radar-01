#!/bin/sh
set -eu
scan_directory=$(mktemp -d /tmp/token-radar-language.XXXXXX)
trap 'rm -rf "$scan_directory"' EXIT HUP INT TERM
node scripts/language-check.mjs "$scan_directory"
set +e
LC_ALL=C.UTF-8 grep -nE -f "$scan_directory/pattern" "$scan_directory"/*.txt
scan_status=$?
set -e
case "$scan_status" in
  0) echo 'FAIL: prohibited product characters found.' >&2; exit 1 ;;
  1) echo 'PASS: UTF-8 grep found no prohibited product characters. English prose also reviewed manually.' ;;
  *) echo "FAIL: grep execution error ($scan_status)." >&2; exit 1 ;;
esac
