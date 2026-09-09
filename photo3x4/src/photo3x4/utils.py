"""Utilitários compartilhados de imagem e validação."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

MAX_UPLOAD_BYTES = 15 * 1024 * 1024


def open_image(data: bytes) -> Image.Image:
    """Abre bytes como RGB/RGBA, gerando um erro amigável para arquivos inválidos."""
    if not data:
        raise ValueError("A imagem está vazia.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError("A imagem deve ter no máximo 15 MB.")
    try:
        image = Image.open(BytesIO(data))
        image.load()
        return image.convert("RGBA")
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Não foi possível ler a imagem enviada.") from exc


def image_to_jpeg(image: Image.Image, dpi: int = 300, quality: int = 95) -> bytes:
    """Codifica uma imagem sobre fundo branco como JPEG."""
    rgb = Image.new("RGB", image.size, "white")
    if image.mode == "RGBA":
        rgb.paste(image, mask=image.getchannel("A"))
    else:
        rgb.paste(image)
    output = BytesIO()
    rgb.save(output, format="JPEG", quality=quality, optimize=True, dpi=(dpi, dpi))
    return output.getvalue()


def image_to_png(image: Image.Image, dpi: int = 300) -> bytes:
    """Codifica uma imagem PNG preservando transparência e resolução."""
    output = BytesIO()
    image.save(output, format="PNG", dpi=(dpi, dpi), optimize=True)
    return output.getvalue()


def stem_for(path: Path) -> str:
    """Retorna o nome-base seguro de um arquivo para saídas da CLI."""
    return path.stem or "foto"


def export_uuid() -> str:
    """Retorna um identificador curto e novo para nomes de exportação."""
    return uuid4().hex
