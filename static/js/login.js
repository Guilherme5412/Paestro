document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const importarBtn = document.getElementById('importar-btn');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtém os valores dos campos
        const username = document.getElementById('username').value.trim();
        const periodoSelect = document.getElementById('periodo');
        const periodo = periodoSelect ? periodoSelect.value : null;
        
        // Validação dos campos
        if (!username || !periodo) {
            alert('Por favor, preencha todos os campos corretamente');
            return;
        }
        
        // Armazena no localStorage
        localStorage.setItem('paestro_usuario', username);
        localStorage.setItem('paestro_periodo', periodo);
        
        // Faz a requisição de login
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                periodo: periodo  // Garante que o período está sendo enviado
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Verifica se o período foi recebido de volta (para debug)
                console.log('Login bem-sucedido. Período:', data.periodo || 'Não retornado');
                
                // Redireciona para a página de chamada
                window.location.href = '/chamada';
            } else {
                throw new Error(data.error || 'Erro ao fazer login');
            }
        })
        .catch(error => {
            console.error('Erro no login:', error);
            alert(error.message || 'Erro ao conectar com o servidor');
        });
    });
    
    // Botão de importar
    importarBtn.addEventListener('click', function() {
        window.location.href = '/importar';
    });

    // Debug: Verifica se há valores salvos no localStorage
    console.log('Usuário armazenado:', localStorage.getItem('paestro_usuario'));
    console.log('Período armazenado:', localStorage.getItem('paestro_periodo'));
});