# photo3x4

Aplicação 100% local para gerar fotos 3x4 brasileiras a partir de uma selfie. O fundo é removido pelo `rembg` em CPU, e a composição final é feita com Pillow. Nenhuma imagem sai do dispositivo/servidor local.

O código da aplicação fica diretamente em `src/`, sem uma subpasta de pacote adicional.

## Instalação

Instale o [uv](https://docs.astral.sh/uv/) e sincronize o ambiente:

```bash
uv sync
```

Na primeira execução, o `rembg` baixa uma vez o modelo CPU leve `u2netp` (cerca de 4 MB); depois o processamento funciona offline. Nenhuma imagem é enviada para fora da máquina.

## Servidor web

```bash
uv run uvicorn src.api:app --reload
```

Abra `http://127.0.0.1:8000`. Para usar no celular conectado à mesma rede Wi-Fi:

```bash
uv run uvicorn src.api:app --host 0.0.0.0 --port 8000
```

Depois acesse `http://IP-DO-COMPUTADOR:8000` no Safari ou Chrome. A câmera do navegador exige contexto seguro em muitos celulares; `localhost` é tratado como seguro, enquanto acesso por IP pode exigir HTTPS conforme o navegador.

## Makefile

Atalhos disponíveis:

```bash
make install
make run
make cli ARGS="selfie.jpg --sheet"
```

## Docker

Para executar com Docker Compose:

```bash
docker compose up --build
```

Acesse `http://localhost:8000`. O cache do modelo do `rembg` é mantido nos volumes `rembg-cache` e `u2net-cache`, evitando um novo download a cada reinicialização.

Para executar em segundo plano:

```bash
docker compose up --build -d
```

Para parar:

```bash
docker compose down
```

Ao acessar pelo celular usando o IP do computador, a câmera pode exigir HTTPS. Nesse caso, configure um proxy local com certificado ou use uma origem segura compatível com o navegador.

## CLI

```bash
uv run photo3x4 selfie.jpg
uv run photo3x4 selfie.jpg --output documento.jpg --size 600x800 --dpi 300
uv run photo3x4 selfie.jpg --sheet
uv run photo3x4 selfie.jpg --transparent
```

As opções `--output`, `--sheet`, `--size`, `--dpi` e `--transparent` estão disponíveis. Sem `--size`, a CLI usa a maior resolução 3:4 possível dentro da imagem original. A CLI reutiliza o mesmo pipeline de remoção de fundo e enquadramento da API.

## API

- `GET /health` — health check.
- `POST /api/process` — recebe o campo multipart `file`, remove o fundo e devolve a captura completa em JPEG para edição.
- `POST /api/sheet` — recebe um JPEG 3x4 no campo `file` e devolve folha 10×15 com 8 cópias.

## Estrutura

O backend fica diretamente em `src`, com rotas em `api.py`, processamento em `processor.py`, composição em `layout.py` e comandos em `cli.py`. O frontend fica em `src/templates` e `src/static`, sendo servido pelo FastAPI com HTML, CSS e JavaScript nativos.
