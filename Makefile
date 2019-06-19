SHELL=/bin/bash
.EXPORT_ALL_VARIABLES:
.SHELLFLAGS = -uec
.PHONY: default

default: final_schema.graphqls

node_modules: package.json
	npm i
	touch node_modules

final_schema.graphqls: schema.graphqls node_modules settings.json src/index.js
	node src/index.js schema.graphqls $$(jq -r '.featureFlags | join(" ")' settings.json) > $@

clean:
	git ls-files --others --ignored --exclude-standard | xargs rm -rf
