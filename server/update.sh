#!/bin/bash
echo "test"
cd ~/tourniquette/server
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
git pull
git checkout prod
npm install
sudo /bin/systemctl restart tourniquette
sleep 2
systemctl status tourniquette
echo -e "\n\n Server up to date & reloaded ; folowing logs : "
journalctl -u tourniquette -f

