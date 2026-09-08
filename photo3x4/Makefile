.PHONY: install run cli

install:
	uv sync

run:
	uv run uvicorn photo3x4.api:app --reload

cli:
	uv run photo3x4 $(ARGS)
