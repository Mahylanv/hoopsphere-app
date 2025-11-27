# Avant tout :
npm install
sudo apt install

# Lancer Hoopsphere :
npx expo start
cd /emarque-parser
uvicorn server:app --host 0.0.0.0 --port 8000
(pour --tunnel)
ngrok http 8000