.PHONY: build rebuild run stop logs clean

build:
	docker compose build

rebuild:
	docker compose build --no-cache

run:
	docker compose up -d

stop:
	docker compose stop

logs:
	docker compose logs -f

clean:
	docker compose down -v

redeploy:
	docker compose down -v && docker compose build --no-cache && docker compose up -d
