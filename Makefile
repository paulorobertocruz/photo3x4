.PHONY: install run build cli

install:
	uv sync

run:
	uv run uvicorn src.api:app --reload

build:
	APP_GIT_SHA=$$(git rev-parse --short HEAD) docker compose build

cli:
	uv run photo3x4 $(ARGS)
