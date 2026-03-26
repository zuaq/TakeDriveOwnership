#!/bin/bash
source "$HOME/.cargo/env" 2>/dev/null
cd "$(dirname "$0")"
npm run tauri dev
