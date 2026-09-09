"""CLI para processamento direto de arquivos."""

from pathlib import Path

import typer

from .processor import process_image
from .utils import export_uuid, image_to_jpeg, image_to_png
from .layout import compose_sheet

app = typer.Typer(add_completion=False, help="Gere fotos brasileiras 3x4 localmente.")


@app.command()
def main(
    input_path: Path = typer.Argument(..., exists=True, readable=True, help="Selfie de entrada."),
    output: Path | None = typer.Option(None, "--output", "-o", help="Arquivo JPEG de saída."),
    sheet: bool = typer.Option(False, "--sheet", help="Também gera uma folha 10x15 com 8 fotos."),
    size: str | None = typer.Option(None, help="Dimensão 3:4; por padrão usa a maior possível."),
    dpi: int = typer.Option(300, min=72, help="DPI gravado no JPEG."),
    transparent: bool = typer.Option(False, help="Mantém fundo transparente (PNG recomendado)."),
) -> None:
    """Processa INPUT_PATH usando exatamente o pipeline da API."""
    result = process_image(input_path.read_bytes(), size=size, transparent=transparent)
    suffix = ".png" if transparent else ".jpg"
    destination = output or input_path.with_name(f"foto3x4-{export_uuid()}{suffix}")
    encoded = image_to_png(result, dpi=dpi) if transparent else image_to_jpeg(result, dpi=dpi)
    destination.write_bytes(encoded)
    typer.echo(f"Foto salva em {destination}")
    if sheet:
        sheet_path = destination.with_name(f"{destination.stem}-folha.jpg")
        sheet_path.write_bytes(image_to_jpeg(compose_sheet(result), dpi=dpi))
        typer.echo(f"Folha salva em {sheet_path}")


def run() -> None:
    """Ponto de entrada instalado pelo uv."""
    app()
