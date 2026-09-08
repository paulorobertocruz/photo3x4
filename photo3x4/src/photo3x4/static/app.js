const $ = (selector) => document.querySelector(selector);
const home = $('#home-screen'), editor = $('#editor-screen'), input = $('#gallery-input');
const canvas = $('#preview'), ctx = canvas.getContext('2d');
let image = null, imageUrl = null, zoom = 1, offset = { x: 0, y: 0 }, dragging = null;

function showError(message) { const box = $('#error'); box.textContent = message; box.classList.remove('hidden'); }
function clearError() { $('#error').classList.add('hidden'); }
function draw() {
  if (!image) return;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Usa a selfie como base e sempre cobre o canvas, evitando faixas vazias
  // ao redimensionar ou aplicar zoom.
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * zoom;
  const width = Math.ceil(image.width * scale), height = Math.ceil(image.height * scale);
  const x = Math.floor((canvas.width - width) / 2 + offset.x);
  const y = Math.floor((canvas.height - height) / 2 + offset.y);
  ctx.drawImage(image, x, y, width, height);
}
function enterEditor(blob) {
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(blob);
  image = new Image(); image.onload = () => { zoom = 1; offset = { x: 0, y: 0 }; $('#zoom').value = 100; $('#zoom-value').textContent = '100%'; draw(); }; image.src = imageUrl;
  home.classList.add('hidden'); editor.classList.remove('hidden');
}
async function process(file) {
  clearError(); $('#processing').classList.remove('hidden');
  try { const form = new FormData(); form.append('file', file, 'foto.jpg'); const response = await fetch('/api/process', { method: 'POST', body: form }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || 'Não foi possível processar a foto.'); } enterEditor(await response.blob()); }
  catch (error) { showError(error instanceof Error ? error.message : 'Não foi possível processar a foto.'); } finally { $('#processing').classList.add('hidden'); }
}
$('#gallery-button').onclick = () => input.click(); input.onchange = () => input.files[0] && process(input.files[0]);
$('#camera-button').onclick = async () => { if (!navigator.mediaDevices?.getUserMedia) { input.click(); return; } let stream; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false }); const modal = document.createElement('div'); modal.className = 'camera-modal'; modal.innerHTML = '<video autoplay playsinline></video><button class="button primary">Capturar</button><button class="text-button camera-cancel">Cancelar</button>'; document.body.append(modal); const live = modal.querySelector('video'); live.srcObject = stream; await live.play(); const close = () => { stream.getTracks().forEach(track => track.stop()); modal.remove(); }; modal.querySelector('.camera-cancel').onclick = close; modal.querySelector('.button').onclick = () => { const shot = document.createElement('canvas'); shot.width = live.videoWidth; shot.height = live.videoHeight; if (!shot.width || !shot.height) { showError('A câmera ainda não está pronta. Tente novamente.'); return; } shot.getContext('2d').drawImage(live, 0, 0); close(); shot.toBlob(blob => blob && process(blob), 'image/jpeg', .95); }; } catch { if (stream) stream.getTracks().forEach(track => track.stop()); input.click(); } };
$('#zoom').oninput = (event) => { zoom = Number(event.target.value) / 100; $('#zoom-value').textContent = `${event.target.value}%`; draw(); };
document.querySelectorAll('[data-move]').forEach(button => button.onclick = () => { const amount = 10, direction = button.dataset.move; if (direction === 'center') offset = { x: 0, y: 0 }; if (direction === 'left') offset.x -= amount; if (direction === 'right') offset.x += amount; if (direction === 'up') offset.y -= amount; if (direction === 'down') offset.y += amount; draw(); });
canvas.onpointerdown = (event) => { canvas.setPointerCapture(event.pointerId); dragging = { x: event.clientX, y: event.clientY }; };
canvas.onpointermove = (event) => { if (!dragging) return; offset.x += event.clientX - dragging.x; offset.y += event.clientY - dragging.y; dragging = { x: event.clientX, y: event.clientY }; draw(); }; canvas.onpointerup = () => dragging = null;
function canvasBlob() { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível preparar a imagem.')), 'image/jpeg', .96)); }
async function downloadSheet() { const form = new FormData(); form.append('file', await canvasBlob(), 'foto-3x4.jpg'); const response = await fetch('/api/sheet', { method: 'POST', body: form }); if (!response.ok) throw new Error('Não foi possível gerar a folha.'); return response.blob(); }
function save(blob, name) { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; link.click(); URL.revokeObjectURL(link.href); }
$('#download-button').onclick = async () => { try { save(await canvasBlob(), 'foto-3x4.jpg'); } catch { showError('Não foi possível salvar a foto.'); } };
$('#sheet-button').onclick = async () => { try { $('#sheet-button').disabled = true; save(await downloadSheet(), 'folha-10x15.jpg'); } catch (error) { showError(error.message); } finally { $('#sheet-button').disabled = false; } };
function returnHome() { editor.classList.add('hidden'); home.classList.remove('hidden'); input.value = ''; clearError(); }
$('#back-button').onclick = returnHome; $('#redo-button').onclick = returnHome;
