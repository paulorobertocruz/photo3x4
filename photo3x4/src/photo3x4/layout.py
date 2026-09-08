"""Composição da foto 3x4 e da folha 10x15."""

from __future__ import annotations

from PIL import Image


def parse_size(value: str) -> tuple[int, int]:
    """Converte ``300x400`` em uma dimensão 3:4 válida."""
    try:
        width, height = (int(part) for part in value.lower().split("x", 1))
    except (ValueError, AttributeError) as exc:
        raise ValueError("Tamanho inválido; use o formato 300x400.") from exc
    if width < 3 or height < 4 or width * 4 != height * 3:
        raise ValueError("O tamanho precisa manter a proporção 3:4.")
    return width, height


def compose_photo(subject: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Recorta o objeto pela caixa alfa e o centraliza em uma tela branca 3:4."""
    rgba = subject.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)

    width, height = size
    # Preenche o quadro 3:4. O ``max`` faz o recorte necessário para que
    # nunca sobrem faixas vazias quando a selfie tem outra proporção.
    target_w, target_h = int(width * 0.96), int(height * 0.95)
    scale = max(target_w / rgba.width, target_h / rgba.height)
    resized = rgba.resize((max(1, int(rgba.width * scale)), max(1, int(rgba.height * scale))), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, "white")
    x = (width - resized.width) // 2
    y = int(height * 0.025)
    canvas.alpha_composite(resized, (x, y))
    return canvas


def compose_sheet(photo: Image.Image, dpi: int = 300) -> Image.Image:
    """Cria folha 10x15 cm a 300 DPI, com oito fotos em 2x4."""
    # 10x15 cm a 300 DPI, retrato, com quatro linhas de duas fotos.
    # O formato retrato é necessário para acomodar quatro cartões de 400 px.
    sheet = Image.new("RGB", (1181, 1772), "white")
    card = photo.convert("RGB").resize((300, 400), Image.Resampling.LANCZOS)
    gap_x, gap_y = 28, 14
    total_w = 2 * card.width + gap_x
    total_h = 4 * card.height + 3 * gap_y
    start_x, start_y = (sheet.width - total_w) // 2, (sheet.height - total_h) // 2
    for row in range(4):
        for column in range(2):
            x = start_x + column * (card.width + gap_x)
            y = start_y + row * (card.height + gap_y)
            sheet.paste(card, (x, y))
    return sheet
