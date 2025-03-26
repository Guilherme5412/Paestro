document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const importarBtn = document.getElementById('importar-btn');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const periodo = document.getElementById('periodo').value;
        
        if (!username || !periodo) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        // Salva o nome do usuário no localStorage
        localStorage.setItem('paestro_usuario', username);
        
        // Faz login via API
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                periodo: periodo
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/chamada';
            } else {
                alert('Erro ao fazer login');
            }
        });
    });
    
    importarBtn.addEventListener('click', function() {
        window.location.href = '/importar';
    });
});