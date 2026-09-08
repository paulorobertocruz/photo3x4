# photo3x4

Aplicação 100% local para gerar fotos 3x4 brasileiras a partir de uma selfie. O fundo é removido pelo `rembg` em CPU, e a composição final é feita com Pillow. Nenhuma imagem sai do dispositivo/servidor local.

## Instalação

Instale o [uv](https://docs.astral.sh/uv/) e sincronize o ambiente:

```bash
uv sync
```

Na primeira execução, o `rembg` baixa uma vez o modelo CPU leve `u2netp` (cerca de 4 MB); depois o processamento funciona offline. Nenhuma imagem é enviada para fora da máquina.

## Servidor web

```bash
uv run uvicorn photo3x4.api:app --reload
```

Abra `http://127.0.0.1:8000`. Para usar no celular conectado à mesma rede Wi-Fi:

```bash
uv run uvicorn photo3x4.api:app --host 0.0.0.0 --port 8000
```

Depois acesse `http://IP-DO-COMPUTADOR:8000` no Safari ou Chrome. A câmera do navegador exige contexto seguro em muitos celulares; `localhost` é tratado como seguro, enquanto acesso por IP pode exigir HTTPS conforme o navegador.

## CLI

```bash
uv run photo3x4 selfie.jpg
uv run photo3x4 selfie.jpg --output documento.jpg --size 600x800 --dpi 300
uv run photo3x4 selfie.jpg --sheet
uv run photo3x4 selfie.jpg --transparent
```

As opções `--output`, `--sheet`, `--size`, `--dpi` e `--transparent` estão disponíveis. A CLI reutiliza o mesmo pipeline de remoção de fundo e enquadramento da API.

## API

- `GET /health` — health check.
- `POST /api/process` — recebe o campo multipart `file` e devolve JPEG 3x4.
- `POST /api/sheet` — recebe um JPEG 3x4 no campo `file` e devolve folha 10×15 com 8 cópias.

## Estrutura

O backend fica em `src/photo3x4`, com rotas em `api.py`, processamento em `processor.py`, composição em `layout.py` e comandos em `cli.py`. O frontend é servido pelo FastAPI e usa apenas HTML, CSS e JavaScript nativos.
