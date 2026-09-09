"""Pipeline de remoção de fundo e composição de documentos fotográficos."""

from __future__ import annotations

from PIL import Image
from rembg import new_session, remove

from .layout import compose_photo, compose_sheet, parse_size
from .utils import open_image


_SESSION = None


def _background_session():
    """Cria uma sessão CPU leve e reutilizável durante a vida do processo."""
    global _SESSION
    if _SESSION is None:
        # u2netp é adequado para uso local: o modelo é muito menor que o
        # bria-rmbg escolhido como padrão pelas versões novas do rembg.
        _SESSION = new_session("u2netp", providers=["CPUExecutionProvider"])
    return _SESSION


def process_image(
    data: bytes,
    size: str = "300x400",
    transparent: bool = False,
    fit: bool = True,
) -> Image.Image:
    """Processa uma selfie usando o modelo local do rembg.

    Quando ``fit`` é falso, mantém o tamanho original para a edição no
    navegador; o recorte 3:4 acontece apenas no canvas ao exportar.
    """
    source = open_image(data)
    cutout = remove(source, session=_background_session()).convert("RGBA")
    if not fit:
        canvas = Image.new("RGBA", source.size, "white")
        canvas.alpha_composite(cutout.resize(source.size, Image.Resampling.LANCZOS))
        return canvas
    if transparent:
        width, height = parse_size(size)
        alpha = cutout.getchannel("A")
        bbox = alpha.getbbox()
        if bbox:
            cutout = cutout.crop(bbox)
        cutout.thumbnail((width, height), Image.Resampling.LANCZOS)
        result = Image.new("RGBA", (width, height), (255, 255, 255, 0))
        result.alpha_composite(cutout, ((width - cutout.width) // 2, (height - cutout.height) // 2))
        return result
    return compose_photo(cutout, parse_size(size))


def process_for_sheet(data: bytes) -> Image.Image:
    """Processa uma imagem já pronta para uma folha 10x15."""
    return compose_sheet(open_image(data))
