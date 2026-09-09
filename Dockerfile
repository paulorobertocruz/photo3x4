FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

ARG APP_GIT_SHA=unknown

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_GIT_SHA=${APP_GIT_SHA} \
    REMBG_HOME=/opt/rembg \
    PATH="/app/.venv/bin:$PATH"

COPY pyproject.toml uv.lock README.md ./
COPY src ./src

RUN uv sync --frozen --no-dev \
    && python -c "from rembg import new_session; new_session('u2netp', providers=['CPUExecutionProvider'])"

EXPOSE 8000

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
