server:
	cd service && npm start

example:
	cd middleware && npm run example

docker-server:
	cd service && docker compose up -d

keys:
	cd service/keys && ./makeKeys.sh

