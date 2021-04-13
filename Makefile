develop:
	npx webpack serve --config webpack.config-dev.js

install:
	npm ci

build:
	npx webpack --config webpack.config-prod.js

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

.PHONY: test
