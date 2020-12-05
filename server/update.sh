#!/bin/bash
echo "test"
cd ~/tourniquette/server
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
git pull
git checkout prod
npm install
sudo /bin/systemctl restart tourniquette
journalctl -n 15000 -u tourniquette -f 

