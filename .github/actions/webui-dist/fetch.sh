#!/usr/bin/env bash
# Finds the WebUI run that built this tree, waits for its webui-dist and
# downloads it into $1/dist. Never fails for want of a build: every way of
# not getting one ends in exit 0 with no $1/dist, and the action builds the
# UI instead. See action.yml for which runs count.
#
# Run in the foreground, or in the background while the appliance boots; it
# writes only under $1, so it can outlive the step that started it.
#
# Needs GH_TOKEN, SHA and BRANCH, and the GITHUB_* variables every step has.
set -euo pipefail

out=$1
mkdir -p "$out"

event=push
[ "$GITHUB_EVENT_NAME" = pull_request ] && event=pull_request
api="$GITHUB_API_URL/repos/$GITHUB_REPOSITORY/actions"
get() { curl -fsS -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" "$1"; }

# Twelve minutes, where it was ten from after the boot: started before the
# boot, the wait gives up at about the same time it always did.
deadline=$((SECONDS + 720))
while :; do
  # A failed query (a 5xx, the token's rate limit) falls back to
  # building rather than failing the job.
  if ! runs=$(get "$api/workflows/main.yml/runs?head_sha=$SHA&event=$event&branch=$BRANCH&per_page=10"); then
    echo "::notice::Could not query the WebUI runs; building the UI here"
    exit 0
  fi
  run=$(jq -c --arg repo "$GITHUB_REPOSITORY" '[.workflow_runs[] | select(.head_repository.full_name == $repo)][0] // empty' <<< "$runs")
  if [ -z "$run" ]; then
    echo "No WebUI $event run of $SHA; building the UI here"
    exit 0
  fi
  id=$(jq -r .id <<< "$run")
  # The list keeps an artifact past its retention, marked expired, and
  # it cannot be downloaded. A failed query says nothing about the
  # artifact, finished run or not, so it is asked again next round.
  listed=false
  if artifacts=$(get "$api/runs/$id/artifacts?name=webui-dist"); then
    listed=true
    artifact=$(jq -c '[.artifacts[] | select(.expired | not)][0] // empty' <<< "$artifacts")
    if [ -n "$artifact" ]; then
      echo "Using the UI WebUI run $id built, $(jq -r .html_url <<< "$run"), after waiting ${SECONDS}s"
      break
    fi
  fi
  if [ "$listed" = true ] && [ "$(jq -r .status <<< "$run")" = completed ]; then
    echo "::notice::WebUI run $id finished with no webui-dist to download (failed, or expired); building the UI here"
    exit 0
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "::notice::WebUI run $id has not uploaded webui-dist after 12 minutes; building the UI here"
    exit 0
  fi
  # Two calls a round, on the token's 1,000 requests an hour that every
  # workflow in the repository shares.
  sleep 20
done

# The zip endpoint redirects to blob storage, and curl drops the
# Authorization header on the way, as that host wants. The digest is the
# zip's, as upload-artifact recorded it.
zip="$out/webui-dist.zip"
started=$SECONDS
if ! curl -fsSL -H "Authorization: Bearer $GH_TOKEN" -o "$zip" "$(jq -r .archive_download_url <<< "$artifact")"; then
  echo "::notice::Could not download webui-dist from WebUI run $id; building the UI here"
  exit 0
fi
digest=$(jq -r '.digest // empty' <<< "$artifact")
if [ -n "$digest" ] && [ "sha256:$(sha256sum "$zip" | cut -d ' ' -f 1)" != "$digest" ]; then
  echo "::notice::webui-dist from WebUI run $id does not match its digest; building the UI here"
  exit 0
fi
# Renamed into place whole, so a caller that stops waiting never finds half.
if ! python3 -m zipfile -e "$zip" "$out/dist.partial"; then
  echo "::notice::Could not unpack webui-dist from WebUI run $id; building the UI here"
  exit 0
fi
mv "$out/dist.partial" "$out/dist"
rm "$zip"
echo "Downloaded webui-dist ($(jq -r .size_in_bytes <<< "$artifact") bytes) in $((SECONDS - started))s"
