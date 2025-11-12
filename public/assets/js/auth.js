// Funções de autenticação e persistência de login
function saveUserSession(userData) {
    localStorage.setItem('userSession', JSON.stringify({
        nome: userData.nome || '',
        email: userData.email || '',
        tipo: userData.tipo || '',
        especialidade: userData.especialidade || '',
        lastActivity: new Date().getTime()
    }));
}

function getUserSession() {
    try {
        const session = localStorage.getItem('userSession');
        if (!session) return null;
        
        const userData = JSON.parse(session);
        // verificar se a sessão não expirou (opcional: 24h)
        const now = new Date().getTime();
        const hours24 = 24 * 60 * 60 * 1000;
        if (now - userData.lastActivity > hours24) {
            clearUserSession();
            return null;
        }
        
        // atualizar timestamp de última atividade
        userData.lastActivity = now;
        localStorage.setItem('userSession', JSON.stringify(userData));
        return userData;
    } catch (e) {
        console.error('Erro ao recuperar sessão:', e);
        return null;
    }
}

function clearUserSession() {
    localStorage.removeItem('userSession');
}

function logout() {
    clearUserSession();
    window.location.href = 'login.html';
}

// Verifica e aplica estado de login em cada página
function checkAuthState() {
    const session = getUserSession();
    if (!session) {
        // se estiver em uma página protegida (dashboard), redirecionar para login
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = 'login.html';
            return;
        }
        return;
    }

    // atualizar UI com dados do usuário
    const avatar = document.getElementById('user-profile-pic');
    if (avatar) {
        // verificar se usuário tem foto salva
        fetch('http://localhost:5000/pessoas')
            .then(res => res.json())
            .then(pessoas => {
                const pessoa = pessoas.find(p => p.email.toLowerCase() === session.email.toLowerCase());
                if (pessoa?.foto) {
                    avatar.src = pessoa.foto.startsWith('http') 
                        ? pessoa.foto 
                        : `http://localhost:5000${pessoa.foto}`;
                }
            })
            .catch(console.error);
    }

    // adicionar link de upload de foto se necessário
    if (session.email) {
        fetch('http://localhost:5000/pessoas')
            .then(res => res.json())
            .then(pessoas => {
                const pessoa = pessoas.find(p => 
                    p.email.toLowerCase() === session.email.toLowerCase()
                );
                if (pessoa && !pessoa.foto) {
                    const ul = document.querySelector('.navbar-nav');
                    if (!ul) return;
                    
                    const uploadLi = document.createElement('li');
                    uploadLi.className = 'nav-item';
                    const uploadLink = document.createElement('a');
                    uploadLink.className = 'nav-link fs-5';
                    uploadLink.href = `upload-foto.html?email=${encodeURIComponent(session.email)}`;
                    uploadLink.textContent = 'Enviar Foto';
                    uploadLi.appendChild(uploadLink);

                    // inserir após Home ou no final
                    const items = Array.from(ul.querySelectorAll('li'));
                    const homeLi = items.find(i => /home/i.test(i.textContent));
                    if (homeLi) ul.insertBefore(uploadLi, homeLi.nextSibling);
                    else ul.appendChild(uploadLi);
                }
            })
            .catch(console.error);
    }
}

// Executar verificação quando documento carrega
document.addEventListener('DOMContentLoaded', checkAuthState);