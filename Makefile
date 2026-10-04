.PHONY: server example docker-server keys test test-service test-example

server:
	cd service && npm start

example:
	cd middleware && npm run example

docker-server:
	cd service && docker compose up -d

keys:
	cd service/keys && ./makeKeys.sh

test: test-service test-example

test-service:
	node --test test/serviceTest.js

test-example:
	node --test test/exampleTest.js
