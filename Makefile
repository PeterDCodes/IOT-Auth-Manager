server:
	cd service && npm start

docker-server:
	cd service && docker compose up -d

keys:
	cd service/keys && ./makeKeys.sh