FOREMAN=node_modules/.bin/nf

all:
	npm run build

dev:
	$(FOREMAN) --procfile Procfile.dev start

.PHONY: all dev