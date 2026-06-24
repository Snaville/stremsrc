#!/bin/sh
set -e
# virtual display for headful Chrome
Xvfb :99 -screen 0 1280x720x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
export DISPLAY=:99
sleep 1
echo "[entrypoint] Xvfb started on :99, launching node"
exec node dist/index.js
