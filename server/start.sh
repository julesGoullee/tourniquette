#!/bin/bash
cd ~/tourniquette/server
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm start
journalctl -u tourniquette -f

