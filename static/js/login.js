document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const importarBtn = document.getElementById('importar-btn');
    const usernameInput = document.getElementById('username');
    const periodoSelect = document.getElementById('periodo');

    // Função para validar campos e mostrar notificações
    function validateFields() {
        let isValid = true;
        
        if (!usernameInput.value.trim()) {
            alert('Por favor, preencha o nome da dupla');
            usernameInput.focus();
            isValid = false;
        } else if (!periodoSelect.value) {
            alert('Por favor, selecione o período');
            periodoSelect.focus();
            isValid = false;
        }
        
        return isValid;
    }

    // Configura o botão de importar
    importarBtn.addEventListener('click', function(e) {
        if (!validateFields()) {
            return;
        }
        
        // Se validado, faz login e redireciona para importar
        const username = usernameInput.value.trim();
        const periodo = periodoSelect.value;
        
        localStorage.setItem('paestro_usuario', username);
        localStorage.setItem('paestro_periodo', periodo);
        
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                periodo: periodo
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Erro no servidor');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.href = '/importar';
            } else {
                throw new Error(data.error || 'Erro ao fazer login');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao conectar com o servidor');
        });
    });

    // Configura o formulário de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateFields()) {
            return;
        }
        
        const username = usernameInput.value.trim();
        const periodo = periodoSelect.value;
        
        localStorage.setItem('paestro_usuario', username);
        localStorage.setItem('paestro_periodo', periodo);
        
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                periodo: periodo
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Erro no servidor');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.href = '/chamada';
            } else {
                throw new Error(data.error || 'Erro ao fazer login');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao conectar com o servidor');
        });
    });

    // Preenche campos se já existir no localStorage
    const savedUser = localStorage.getItem('paestro_usuario');
    const savedPeriodo = localStorage.getItem('paestro_periodo');
    if (savedUser) usernameInput.value = savedUser;
    if (savedPeriodo) periodoSelect.value = savedPeriodo;
});