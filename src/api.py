"""Aplicação FastAPI da interface e da API REST do photo3x4."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image

from .processor import process_for_sheet, process_image
from .utils import image_to_jpeg

BASE_DIR = Path(__file__).parent
app = FastAPI(title="photo3x4", version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def home() -> str:
    """Entrega a aplicação web de uma página."""
    return (BASE_DIR / "templates" / "index.html").read_text(encoding="utf-8")


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check simples."""
    return {"status": "ok"}


@app.post("/api/process")
async def process(file: UploadFile = File(...)) -> Response:
    """Remove o fundo e retorna a captura completa para edição no navegador."""
    try:
        result = process_image(await file.read(), fit=False)
        return Response(content=image_to_jpeg(result), media_type="image/jpeg")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Não foi possível processar a foto.") from exc


@app.post("/api/sheet")
async def sheet(file: UploadFile = File(...)) -> Response:
    """Recebe uma foto 3x4 e retorna oito cópias em uma folha 10x15."""
    try:
        result = process_for_sheet(await file.read())
        return Response(content=image_to_jpeg(result), media_type="image/jpeg")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Não foi possível gerar a folha.") from exc
