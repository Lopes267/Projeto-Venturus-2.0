// Adiciona o link do dashboard na navegação quando houver sessão ativa
function updateNavigation() {
    const session = getUserSession();
    if (!session) return;

    const navbarNav = document.querySelector('.navbar-nav');
    if (!navbarNav) return;

    // Verificar se o link do dashboard já existe
    if (document.getElementById('dashboardNavItem')) return;

    // Criar novo item de navegação
    const dashboardItem = document.createElement('li');
    dashboardItem.className = 'nav-item';
    dashboardItem.id = 'dashboardNavItem';

    const dashboardLink = document.createElement('a');
    dashboardLink.className = 'nav-link fs-5';
    dashboardLink.textContent = 'Dashboard';

    // Configurar URL do dashboard baseado no tipo de usuário
    const emailParam = encodeURIComponent(session.email || '');
    const nomeParam = encodeURIComponent(session.nome || '');
    const dashboardUrl = session.tipo === 'medico' 
        ? `dashboard-doutor.html?nome=${nomeParam}&email=${emailParam}`
        : `dashboard-paciente.html?nome=${nomeParam}&email=${emailParam}`;
    
    dashboardLink.href = dashboardUrl;
    dashboardItem.appendChild(dashboardLink);

    // Inserir após o link Home
    const items = Array.from(navbarNav.querySelectorAll('li'));
    const homeLi = items.find(i => /home/i.test(i.textContent));
    if (homeLi) {
        homeLi.parentNode.insertBefore(dashboardItem, homeLi.nextSibling);
    } else {
        navbarNav.appendChild(dashboardItem);
    }
}

// --- Dark mode utilities ---
function setDarkMode(enabled) {
    try {
        if (enabled) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', enabled ? '1' : '0');
        // atualizar ícone do botão flutuante se existir
        const btn = document.getElementById('darkModeToggle');
        if (btn) btn.textContent = enabled ? '☀️' : '🌙';
    } catch (e) {
        console.error('Erro ao aplicar modo escuro:', e);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
    setDarkMode(!isDark);
}

function initDarkMode() {
    try {
        const v = localStorage.getItem('darkMode');
        if (v === null) return; // manter padrão do CSS
        setDarkMode(v === '1');
    } catch (e) {
        console.error('Erro ao inicializar dark mode:', e);
    }
}

// Modifica a navegação para incluir Dashboard e botão de tema
function enhanceNavigationUI() {
    // criar botão flutuante no canto inferior esquerdo (aparece em todas as páginas)
    if (!document.getElementById('darkModeFloating')) {
        const container = document.createElement('div');
        container.id = 'darkModeFloating';
        container.style.position = 'fixed';
        container.style.left = '14px';
        container.style.bottom = '14px';
        container.style.zIndex = '2000';

        const btn = document.createElement('button');
        btn.id = 'darkModeToggle';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Alternar tema');
    btn.style.width = '64px';
    btn.style.height = '64px';
        btn.style.borderRadius = '50%';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
    btn.style.boxShadow = '0 8px 22px rgba(0,0,0,0.18)';
    btn.style.fontSize = '22px';
        btn.style.background = 'var(--amarelo)';
        btn.style.color = 'var(--preto)';
        btn.addEventListener('click', toggleDarkMode);

        // definir ícone atual
        const isDarkNow = document.body.classList.contains('dark-mode') || localStorage.getItem('darkMode') === '1';
        btn.textContent = isDarkNow ? '☀️' : '🌙';

        container.appendChild(btn);
        document.body.appendChild(container);
    }
}

// Esconde os links de autenticação (Login / Cadastre-se) quando o usuário está logado
function hideAuthNavItems() {
    try {
        const session = getUserSession();
        const navbarNav = document.querySelector('.navbar-nav');
        if (!navbarNav) return;

        const anchors = Array.from(navbarNav.querySelectorAll('a'));
        anchors.forEach(a => {
            const href = (a.getAttribute('href') || '').toLowerCase();
            const text = (a.textContent || '').toLowerCase();
            const isAuthLink = href.includes('login.html') || href.includes('cadastro.html') || /login|cadastre|cadastro/.test(text);
            if (isAuthLink) {
                const li = a.closest('li');
                if (!li) return;
                if (session) li.style.display = 'none';
                else li.style.display = ''; // mostrar caso não logado
            }
        });
    } catch (e) {
        console.error('Erro ao esconder links de autenticação:', e);
    }
}

// Verificar sessão e melhorar a UI quando a página carregar
document.addEventListener('DOMContentLoaded', function () {
    try {
        initDarkMode();
        enhanceNavigationUI();
        updateNavigation();
        // esconder links de login/cadastro quando o usuário estiver logado
        hideAuthNavItems();
        // esconder link que aponta para a própria página (ex: mostrar 'Home' omitido quando já está no home)
        hideLinkToCurrentPage();
    } catch (e) {
        console.error(e);
    }
});

// Esconde na navbar o link que aponta para a página atual (ex.: 'Home' quando estiver em index.html)
function hideLinkToCurrentPage() {
    try {
        const navbarNav = document.querySelector('.navbar-nav');
        if (!navbarNav) return;

        // obter segmento atual (nome do arquivo)
        let current = window.location.pathname.split('/').pop().toLowerCase();
        if (!current || current === '') current = 'index.html'; // tratar raiz como index

        const anchors = Array.from(navbarNav.querySelectorAll('a'));
        anchors.forEach(a => {
            const href = a.getAttribute('href') || '';
            // resolver href absoluto para comparar
            try {
                const resolved = new URL(href, window.location.href);
                let target = resolved.pathname.split('/').pop().toLowerCase();
                if (!target || target === '') target = 'index.html';
                if (target === current) {
                    const li = a.closest('li');
                    if (li) li.style.display = 'none';
                }
            } catch (e) {
                // se URL falhar, fallback para comparação simples de string
                if (href.toLowerCase().includes(current.replace('index.html',''))) {
                    const li = a.closest('li');
                    if (li) li.style.display = 'none';
                }
            }
        });
    } catch (e) {
        console.error('Erro ao esconder link da página atual:', e);
    }
}