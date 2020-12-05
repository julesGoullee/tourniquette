#!/bin/bash
echo "test"
cd ~/tourniquette/server
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
git pull
git checkout systemd-server
npm install
sudo /bin/systemctl restart tourniquette
journalctl -u tourniquette -f

