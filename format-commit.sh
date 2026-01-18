#!/usr/bin/env sh

set -eu

ts_html_tmp=$(mktemp)
scss_tmp=$(mktemp)
trap 'rm -f "$ts_html_tmp" "$scss_tmp"' EXIT INT TERM

# 只处理已暂存的改动文件（NUL 分隔保证文件名安全）
git diff --cached -z --name-only --diff-filter=ACM | while IFS= read -r -d '' file; do
  case "$file" in
    *.ts|*.html) printf '%s\0' "$file" >>"$ts_html_tmp" ;;
    *.scss) printf '%s\0' "$file" >>"$scss_tmp" ;;
  esac
done

ts_html_bytes=$(wc -c <"$ts_html_tmp")
scss_bytes=$(wc -c <"$scss_tmp")

if [ "$ts_html_bytes" -eq 0 ] && [ "$scss_bytes" -eq 0 ]; then
  echo "No staged files to format"
  exit 0
fi

if [ "$ts_html_bytes" -gt 0 ]; then
  xargs -0 yarn dlx eslint --cache --fix <"$ts_html_tmp"
  xargs -0 git add -- <"$ts_html_tmp"
fi

if [ "$scss_bytes" -gt 0 ]; then
  xargs -0 yarn dlx stylelint --fix <"$scss_tmp"
  xargs -0 git add -- <"$scss_tmp"
fi
