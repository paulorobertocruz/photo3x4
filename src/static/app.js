const $ = (selector) => document.querySelector(selector);
const home = $('#home-screen'), editor = $('#editor-screen'), input = $('#gallery-input'), appShell = $('.app-shell');
const canvas = $('#preview'), ctx = canvas.getContext('2d');
let image = null, imageUrl = null, zoom = 1, offset = { x: 0, y: 0 }, dragging = null;

function showError(message) { const box = $('#error'); box.textContent = message; box.classList.remove('hidden'); }
function clearError() { $('#error').classList.add('hidden'); }
function draw() {
  if (!image) return;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Usa a selfie como base e sempre cobre o canvas, evitando faixas vazias
  // ao redimensionar ou aplicar zoom.
  const baseScale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const scale = baseScale * Math.max(zoom, 1);
  const width = Math.ceil(image.width * scale), height = Math.ceil(image.height * scale);
  const x = Math.floor((canvas.width - width) / 2 + offset.x);
  const y = Math.floor((canvas.height - height) / 2 + offset.y);
  ctx.drawImage(image, x, y, width, height);
}
function outputSize(width, height) {
  if (width / height > 3 / 4) return { width: Math.floor(height * 3 / 4), height };
  return { width, height: Math.floor(width * 4 / 3) };
}
function enterEditor(blob) {
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(blob);
  image = new Image(); image.onload = () => { const size = outputSize(image.naturalWidth, image.naturalHeight); canvas.width = size.width; canvas.height = size.height; zoom = 1; offset = { x: 0, y: 0 }; $('#zoom').value = 100; $('#zoom-value').textContent = '100%'; draw(); }; image.src = imageUrl;
  home.classList.add('hidden'); editor.classList.remove('hidden'); appShell.classList.add('editing');
}
async function process(file) {
  clearError(); $('#processing').classList.remove('hidden');
  try { const form = new FormData(); form.append('file', file, 'foto.jpg'); const response = await fetch('/api/process', { method: 'POST', body: form }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || 'Não foi possível processar a foto.'); } enterEditor(await response.blob()); }
  catch (error) { showError(error instanceof Error ? error.message : 'Não foi possível processar a foto.'); } finally { $('#processing').classList.add('hidden'); }
}
$('#gallery-button').onclick = () => input.click(); input.onchange = () => input.files[0] && process(input.files[0]);
$('#camera-button').onclick = async () => { if (!navigator.mediaDevices?.getUserMedia) { input.click(); return; } let stream; let facingMode = 'user'; try { const modal = document.createElement('div'); modal.className = 'camera-modal'; modal.innerHTML = '<video autoplay playsinline></video><div class="camera-guide" aria-hidden="true"><div class="guide-frame"><span class="guide-head"></span><span class="guide-shoulders"></span><span class="guide-corner guide-corner-top"></span><span class="guide-corner guide-corner-bottom"></span></div><p>Centralize o rosto e os ombros</p></div><button class="text-button camera-switch" type="button" aria-label="Usar câmera traseira">↻</button><button class="button primary">Capturar</button><button class="text-button camera-cancel">Cancelar</button>'; document.body.append(modal); const live = modal.querySelector('video'); const switchButton = modal.querySelector('.camera-switch'); const startCamera = async (mode, strict = false) => { if (stream) stream.getTracks().forEach(track => track.stop()); const facing = strict ? { exact: mode } : { ideal: mode }; stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }); live.srcObject = stream; live.classList.toggle('camera-flipped', mode === 'user'); await live.play(); switchButton.textContent = '↻'; switchButton.setAttribute('aria-label', mode === 'user' ? 'Usar câmera traseira' : 'Usar câmera frontal'); }; await startCamera(facingMode); const close = () => { if (stream) stream.getTracks().forEach(track => track.stop()); modal.remove(); }; switchButton.onclick = async () => { const nextMode = facingMode === 'user' ? 'environment' : 'user'; switchButton.disabled = true; try { await startCamera(nextMode, true); facingMode = nextMode; } catch { showError('Esta câmera não está disponível neste dispositivo.'); try { await startCamera(facingMode); } catch { close(); } } finally { switchButton.disabled = false; } }; modal.querySelector('.camera-cancel').onclick = close; modal.querySelector('.button').onclick = () => { const shot = document.createElement('canvas'); shot.width = live.videoWidth; shot.height = live.videoHeight; if (!shot.width || !shot.height) { showError('A câmera ainda não está pronta. Tente novamente.'); return; } const shotContext = shot.getContext('2d'); if (facingMode === 'user') { shotContext.translate(shot.width, 0); shotContext.scale(-1, 1); } shotContext.drawImage(live, 0, 0); close(); shot.toBlob(blob => blob && process(blob), 'image/jpeg', .95); }; } catch { if (stream) stream.getTracks().forEach(track => track.stop()); input.click(); } };
$('#zoom').oninput = (event) => { zoom = Number(event.target.value) / 100; $('#zoom-value').textContent = `${event.target.value}%`; draw(); };
document.querySelectorAll('[data-move]').forEach(button => button.onclick = () => { const amount = Math.round(canvas.width * .03), direction = button.dataset.move; if (direction === 'center') offset = { x: 0, y: 0 }; if (direction === 'left') offset.x -= amount; if (direction === 'right') offset.x += amount; if (direction === 'up') offset.y -= amount; if (direction === 'down') offset.y += amount; draw(); });
canvas.onpointerdown = (event) => { canvas.setPointerCapture(event.pointerId); dragging = { x: event.clientX, y: event.clientY }; };
canvas.onpointermove = (event) => { if (!dragging) return; offset.x += (event.clientX - dragging.x) * canvas.width / canvas.clientWidth; offset.y += (event.clientY - dragging.y) * canvas.height / canvas.clientHeight; dragging = { x: event.clientX, y: event.clientY }; draw(); }; canvas.onpointerup = () => dragging = null;
function canvasBlob() { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível preparar a imagem.')), 'image/jpeg', .96)); }
async function downloadSheet() { const form = new FormData(); form.append('file', await canvasBlob(), 'foto3x4.jpg'); const response = await fetch('/api/sheet', { method: 'POST', body: form }); if (!response.ok) throw new Error('Não foi possível gerar a folha.'); return response.blob(); }
function freshUuid() { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`; }
function save(blob, name) { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
const saveModal = $('#save-modal');
function closeSaveModal() { saveModal.classList.add('hidden'); }
$('#save-button').onclick = () => saveModal.classList.remove('hidden');
$('#close-save-modal').onclick = closeSaveModal;
saveModal.onclick = (event) => { if (event.target === saveModal) closeSaveModal(); };
$('#save-photo-modal').onclick = async () => { try { save(await canvasBlob(), `foto3x4-${freshUuid()}.jpg`); closeSaveModal(); } catch { showError('Não foi possível salvar a foto.'); } };
$('#save-sheet-modal').onclick = async () => { try { $('#save-sheet-modal').disabled = true; save(await downloadSheet(), `foto3x4-${freshUuid()}-folha.jpg`); closeSaveModal(); } catch (error) { showError(error.message); } finally { $('#save-sheet-modal').disabled = false; } };
function returnHome() { editor.classList.add('hidden'); home.classList.remove('hidden'); appShell.classList.remove('editing'); closeSaveModal(); input.value = ''; clearError(); }
$('#back-button').onclick = returnHome; $('#redo-button').onclick = returnHome;
