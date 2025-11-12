// Verificar sessão existente e mostrar link do dashboard
function checkAndShowDashboardLink() {
    const session = getUserSession();
    const navItem = document.getElementById('dashboardNavItem');
    const navLink = document.getElementById('dashboardNavLink');
    
    if (session && navItem && navLink) {
        const emailParam = encodeURIComponent(session.email || '');
        const nomeParam = encodeURIComponent(session.nome || '');
        const dashboardUrl = session.tipo === 'medico' 
            ? `dashboard-doutor.html?nome=${nomeParam}&email=${emailParam}`
            : `dashboard-paciente.html?nome=${nomeParam}&email=${emailParam}`;
        
        navLink.href = dashboardUrl;
        navItem.style.display = 'block';
    }
}

// Verificar sessão quando a página carregar
document.addEventListener('DOMContentLoaded', checkAndShowDashboardLink);

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.onsubmit = async function (e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('#email').value.trim().toLowerCase();
    const senha = form.querySelector('#password').value;

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const resultado = await res.json();

      
      console.log("Resposta /login:", res.status, resultado);

      if (!resultado.success) {
        const status = document.getElementById('loginStatus');
        if (status) {
          status.style.color = 'red';
          status.textContent = resultado.message || 'Usuário ou senha incorretos.';
        }
        return;
      }

      
      // salvar dados do usuário no localStorage
      saveUserSession(resultado);

      const nomeParam = encodeURIComponent(resultado.nome || '');
      const emailParam = encodeURIComponent(email || '');
      if (resultado.tipo === 'medico') {
        window.location.href = `dashboard-doutor.html?nome=${nomeParam}&email=${emailParam}`;
      } else {
        window.location.href = `dashboard-paciente.html?nome=${nomeParam}&email=${emailParam}`;
      }

    } catch (err) {
      console.error("Erro na requisição de login:", err);
      const status = document.getElementById('loginStatus');
      if (status) {
        status.style.color = 'red';
        status.textContent = 'Erro de conexão com o servidor.';
      }
    }
  };
}

// Cadastrar como cliente button
const btn = document.getElementById('btnCadastrar');
if (btn) {
  btn.addEventListener('click', () => {
    window.location.href = 'teste.html?tipo=cliente';
  });
}
