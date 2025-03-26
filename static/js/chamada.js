document.addEventListener('DOMContentLoaded', function() {
    const turmaSelect = document.getElementById('turma-select');
    const escolaSelect = document.getElementById('escola-select');
    const addAlunoBtn = document.getElementById('add-aluno-btn');
    const alunosTable = document.getElementById('alunos-table').getElementsByTagName('tbody')[0];
    const salvarChamadaBtn = document.getElementById('salvar-chamada-btn');
    const exportarExcelBtn = document.getElementById('exportar-excel-btn');
    const dataAtualElement = document.getElementById('data-atual');
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    
    // Exibe data atual
    const hoje = new Date();
    dataAtualElement.textContent = hoje.toLocaleDateString('pt-BR');
    
    // Recupera nome do usuário do localStorage
    const nomeUsuario = localStorage.getItem('paestro_usuario');
    if (nomeUsuario) {
        nomeUsuarioElement.textContent = nomeUsuario;
    }
    
    // Carrega turmas disponíveis
    function carregarTurmas() {
        // Tenta obter turmas do localStorage primeiro
        const turmasSalvas = localStorage.getItem('turmas_disponiveis');
        
        if (turmasSalvas) {
            const turmas = JSON.parse(turmasSalvas);
            atualizarSelectTurmas(turmas);
            console.log('Turmas carregadas do localStorage:', turmas);
        } else {
            // Se não tiver no localStorage, busca da API
            fetch('/api/get_turmas')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        atualizarSelectTurmas(data.turmas);
                        console.log('Turmas carregadas da API:', data.turmas);
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar turmas:', error);
                });
        }
    }
    
    // Função para atualizar o select com as turmas
    function atualizarSelectTurmas(turmas) {
        const select = document.getElementById('turma-select');
        select.innerHTML = '<option value="">Selecione uma turma</option>';
        
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            select.appendChild(option);
        });
        
        // Adiciona evento para debug
        select.addEventListener('change', function() {
            console.log('Turma selecionada:', this.value);
        });
    }
    
    // Chama a função ao carregar a página
    carregarTurmas();
    
    // Carrega alunos da turma selecionada
    turmaSelect.addEventListener('change', function() {
        const turma = this.value;
        if (!turma) return;
        
        fetch('/api/get_class', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ class: turma })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alunosTable.innerHTML = '';
                data.alunos.forEach((aluno, index) => {
                    const row = alunosTable.insertRow();
                    
                    // Nome do aluno
                    const cellNome = row.insertCell(0);
                    cellNome.textContent = aluno.nome;
                    
                    // Presença (P, F, FJ)
                    const cellPresenca = row.insertCell(1);
                    const presencaSelect = document.createElement('select');
                    presencaSelect.className = 'presenca-select';
                    presencaSelect.dataset.aluno = aluno.nome;
                    
                    ['P', 'F', 'FJ'].forEach(opcao => {
                        const option = document.createElement('option');
                        option.value = opcao;
                        option.textContent = opcao;
                        if (opcao === aluno.presenca) {
                            option.selected = true;
                        }
                        presencaSelect.appendChild(option);
                    });
                    
                    cellPresenca.appendChild(presencaSelect);
                    
                    // Observação
                    const cellObs = row.insertCell(2);
                    const obsInput = document.createElement('input');
                    obsInput.type = 'text';
                    obsInput.className = 'observacao-input';
                    obsInput.dataset.aluno = aluno.nome;
                    obsInput.value = aluno.observacao || '';
                    cellObs.appendChild(obsInput);
                });
            }
        });
    });
    
    // Adicionar aluno manualmente
    addAlunoBtn.addEventListener('click', function() {
        const turma = turmaSelect.value;
        if (!turma) {
            alert('Selecione uma turma primeiro');
            return;
        }
        
        const nomeAluno = prompt('Digite o nome do aluno:');
        if (nomeAluno) {
            const row = alunosTable.insertRow();
            
            const cellNome = row.insertCell(0);
            cellNome.textContent = nomeAluno;
            
            const cellPresenca = row.insertCell(1);
            const presencaSelect = document.createElement('select');
            presencaSelect.className = 'presenca-select';
            presencaSelect.dataset.aluno = nomeAluno;
            
            ['P', 'F', 'FJ'].forEach(opcao => {
                const option = document.createElement('option');
                option.value = opcao;
                option.textContent = opcao;
                if (opcao === 'P') {
                    option.selected = true;
                }
                presencaSelect.appendChild(option);
            });
            
            cellPresenca.appendChild(presencaSelect);
            
            const cellObs = row.insertCell(2);
            const obsInput = document.createElement('input');
            obsInput.type = 'text';
            obsInput.className = 'observacao-input';
            obsInput.dataset.aluno = nomeAluno;
            obsInput.value = '';
            cellObs.appendChild(obsInput);
        }
    });
    
    // Salvar chamada
    salvarChamadaBtn.addEventListener('click', function() {
        const turma = turmaSelect.value;
        if (!turma) {
            alert('Selecione uma turma primeiro');
            return;
        }
        
        const alunosData = [];
        const rows = alunosTable.rows;
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].cells;
            const nome = cells[0].textContent;
            const presenca = cells[1].querySelector('select').value;
            const observacao = cells[2].querySelector('input').value;
            
            alunosData.push({
                nome: nome,
                presenca: presenca,
                observacao: observacao
            });
        }
        
        fetch('/api/save_attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                turma: turma,
                alunos: alunosData
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Chamada da turma ' + turma + ' salva com sucesso!');
            } else {
                alert('Erro ao salvar chamada: ' + (data.error || 'Desconhecido'));
            }
        });
    });
    
    // Exportar para Excel
    exportarExcelBtn.addEventListener('click', function() {
        window.location.href = '/api/export_excel';
    });
    
    // Carrega turmas ao iniciar
    carregarTurmas();
});