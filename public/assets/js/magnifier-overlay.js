// public/assets/js/magnifier-overlay.js
(function () {
  const SELECTORS = 'p, span, li, h1, h2, h3, h4, h5, h6, a, label, td, th, .card-text';
  let enabled = false;
  let overlay = null;
  let mouseMoveHandler = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'text-magnifier-overlay';
    overlay.style.position = 'fixed';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    overlay.style.zIndex = 99999;
    overlay.style.padding = '10px 12px';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.color = '#fff';
    overlay.style.borderRadius = '8px';
    overlay.style.maxWidth = '320px';
    overlay.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
    overlay.style.fontSize = '1.25rem';
    overlay.style.lineHeight = '1.3';
    overlay.style.wordBreak = 'break-word';
    overlay.style.transition = 'transform 80ms ease, opacity 120ms ease';
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);
  }

  function onOver(e) {
    const el = e.target.closest(SELECTORS);
    if (!el) return;
    const text = el.textContent.trim();
    if (!text) {
        // Se não houver texto, esconde o overlay
        if (overlay.style.display !== 'none') {
            onOut(e); 
        }
        return;
    }

    overlay.textContent = text.length > 1000 ? text.slice(0, 1000) + '…' : text;
    overlay.style.display = 'block';
    overlay.style.opacity = '1';

    // Novo: Inicia o rastreador de mouse APENAS se ele ainda não estiver ativo.
    if (!mouseMoveHandler) {
      mouseMoveHandler = (ev) => {
        positionOverlay(ev);
      };
      document.addEventListener('mousemove', mouseMoveHandler);
    }
  }
  function onOut(e) {
    // Não removemos o mouseMoveHandler aqui para manter o rastreamento ativo
    // enquanto o usuário se move sobre a página.

    // Apenas esconde o overlay
    overlay.style.opacity = '0';
    // Mantém o setTimeout para permitir a animação de opacidade
    setTimeout(()=> overlay.style.display = 'none', 140); 
  }

  function positionOverlay(ev) {
    const padding = 12;
    const w = overlay.offsetWidth;
    const h = overlay.offsetHeight;
    // prefer place right-bottom of cursor, but avoid going outside viewport
    let x = ev.clientX + 18;
    let y = ev.clientY + 18;
    if (x + w + padding > window.innerWidth) x = ev.clientX - w - 18;
    if (y + h + padding > window.innerHeight) y = ev.clientY - h - 18;
    overlay.style.left = `${Math.max(8, x)}px`;
    overlay.style.top = `${Math.max(8, y)}px`;
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    if (!overlay) createOverlay();
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.body.classList.add('text-magnifier-active');
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    document.removeEventListener('mouseover', onOver, true);
    document.removeEventListener('mouseout', onOut, true);
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
    if (overlay) {
      overlay.style.display = 'none';
    }
    document.body.classList.remove('text-magnifier-active');
  }

  function toggle() { enabled ? disable() : enable(); }

  // expose API
  window.textMagnifierOverlay = { enable, disable, toggle, isEnabled: () => enabled };

  // optional: add a small toggle button automatically (you can remove this and add your own UI)
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.id = 'textMagnifierOverlayToggle';
    btn.title = 'Alternar lupa de texto';
    btn.innerHTML = '<i class="bi bi-search"></i>'; // usa bootstrap-icons
    Object.assign(btn.style, {
      position: 'fixed',
      left: '14px',
      bottom: '90px', // acima do botão de tema caso exista
      zIndex: 20000,
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: 'none',
      background: 'var(--amarelo)',
      color: 'var(--preto)',
      boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
      cursor: 'pointer'
    });
    btn.addEventListener('click', () => {
      toggle();
      btn.classList.toggle('active', window.textMagnifierOverlay.isEnabled());
    });
    document.body.appendChild(btn);
  });
})();
function createOverlay() {
    overlay = document.createElement('div');
    // ... (estilos existentes)
    overlay.style.pointerEvents = 'none'; // Essencial!
    // Novo: Define o cursor padrão para evitar que o cursor do overlay
    // mude para 'text-input' ou 'pointer' se o conteúdo do overlay
    // tiver elementos clicáveis ou texto selecionável.
    overlay.style.cursor = 'default';
    // ...
    document.body.appendChild(overlay);
  }
// public/assets/js/magnifier-overlay.js
(function () {
  const SELECTORS = 'p, span, li, h1, h2, h3, h4, h5, h6, a, label, td, th, .card-text';
  let enabled = false;
  let overlay = null;
  let mouseMoveHandler = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'text-magnifier-overlay';
    overlay.style.position = 'fixed';
    overlay.style.pointerEvents = 'none'; // CRUCIAL: Impede que o overlay intercepte o mouse
    overlay.style.display = 'none';
    overlay.style.zIndex = 99999;
    overlay.style.padding = '10px 12px';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.color = '#fff';
    overlay.style.borderRadius = '8px';
    overlay.style.maxWidth = '320px';
    overlay.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
    overlay.style.fontSize = '1.25rem';
    overlay.style.lineHeight = '1.3';
    overlay.style.wordBreak = 'break-word';
    overlay.style.transition = 'opacity 120ms ease'; // Removi a transição de transform
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);
  }
    
    // NOVO: Função centralizada que lida com o movimento do mouse
    function handleMouseMove(ev) {
        // 1. Encontra o elemento de texto
        const el = ev.target.closest(SELECTORS);
        const text = el ? el.textContent.trim() : null;

        if (text && text.length > 0) {
            // 2. Atualiza e mostra a lupa
            overlay.textContent = text.length > 1000 ? text.slice(0, 1000) + '…' : text;
            overlay.style.display = 'block';
            overlay.style.opacity = '1';
        } else {
            // 3. Esconde a lupa se não houver texto válido
            if (overlay.style.opacity === '1') {
                overlay.style.opacity = '0';
                // Garante que o display seja removido após a transição
                setTimeout(() => overlay.style.display = 'none', 140);
            }
        }
        
        // 4. Posiciona o overlay (mantém a lógica anterior)
        positionOverlay(ev);
    }
    
  function positionOverlay(ev) {
    const padding = 12;
    const w = overlay.offsetWidth;
    const h = overlay.offsetHeight;
    // prefer place right-bottom of cursor, but avoid going outside viewport
    let x = ev.clientX + 18;
    let y = ev.clientY + 18;
    if (x + w + padding > window.innerWidth) x = ev.clientX - w - 18;
    if (y + h + padding > window.innerHeight) y = ev.clientY - h - 18;
    overlay.style.left = `${Math.max(8, x)}px`;
    overlay.style.top = `${Math.max(8, y)}px`;
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    if (!overlay) createOverlay();
    
    // NOVO: Remove os event listeners 'mouseover' e 'mouseout' instáveis
    // e usa apenas o 'mousemove' para tudo.
    mouseMoveHandler = handleMouseMove;
    document.addEventListener('mousemove', mouseMoveHandler, true);

    document.body.classList.add('text-magnifier-active');
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    
    // NOVO: Remove o listener 'mousemove'
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler, true);
      mouseMoveHandler = null;
    }

    if (overlay) {
      overlay.style.opacity = '0';
      // Garante que o overlay é removido da tela após o efeito
      setTimeout(() => overlay.style.display = 'none', 140);
    }
    document.body.classList.remove('text-magnifier-active');
  }

  function toggle() { enabled ? disable() : enable(); }

  // expose API
  window.textMagnifierOverlay = { enable, disable, toggle, isEnabled: () => enabled };

  // optional: add a small toggle button automatically (mantido)
  document.addEventListener('DOMContentLoaded', () => {
    // ... (Código do botão inalterado)
    const btn = document.createElement('button');
    btn.id = 'textMagnifierOverlayToggle';
    btn.title = 'Alternar lupa de texto';
    btn.innerHTML = '<i class="bi bi-search"></i>'; // usa bootstrap-icons
    Object.assign(btn.style, {
      position: 'fixed',
      left: '14px',
      bottom: '90px', // acima do botão de tema caso exista
      zIndex: 20000,
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: 'none',
      background: 'var(--amarelo)',
      color: 'var(--preto)',
      boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
      cursor: 'pointer'
    });
    btn.addEventListener('click', () => {
      toggle();
      btn.classList.toggle('active', window.textMagnifierOverlay.isEnabled());
    });
    document.body.appendChild(btn);
  });
})();
  