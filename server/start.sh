#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
git pull
git checkout prod
npm install
sudo systemctl restart tourniquette
sudo journalctl -u tourniquette -f

