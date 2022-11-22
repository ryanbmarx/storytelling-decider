# publishing contract

TARGET?=dev

install:
	npm ci

update:
	make clean
	mkdir -p ./functions/data
	node ./functions/update.js

build:
	mkdir -p ./public
	npm run static
	npm run build
	make uw
uw: 
	mkdir -p ./public/uw
	node ./functions/ssr.js
deploy:
	./deploy.sh

preprod:
	./deploy.sh --preprod

publish:
	./deploy.sh --production

clean: 
	rm -rf functions/data/

preview:
	node functions/preview.js