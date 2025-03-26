const appData = {
    schools: {},
    classes: {},
    attendance_status: {},
    observations: {},
    saved_classes: new Set()
};

document.addEventListener('DOMContentLoaded', function() {
    const escolaSelect = document.getElementById('escola-select');
    const turmaSelect = document.getElementById('turma-select');
    const addAlunoBtn = document.getElementById('add-aluno-btn');
    const alunosTable = document.getElementById('alunos-table').getElementsByTagName('tbody')[0];
    const salvarChamadaBtn = document.getElementById('salvar-chamada-btn');
    const exportarExcelBtn = document.getElementById('exportar-excel-btn');
    const dataAtualElement = document.getElementById('data-atual');
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    
    // Exibe data atual e usuário
    const hoje = new Date();
    dataAtualElement.textContent = hoje.toLocaleDateString('pt-BR');
    nomeUsuarioElement.textContent = localStorage.getItem('paestro_usuario') || '';
    
    // Carrega escolas disponíveis
    function carregarEscolas() {
        fetch('/api/get_schools')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    escolaSelect.innerHTML = '<option value="">Selecione uma escola</option>';
                    data.schools.forEach(escola => {
                        const option = document.createElement('option');
                        option.value = escola;
                        option.textContent = escola;
                        escolaSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar escolas:', error);
            });
    }
    
    // Carrega turmas quando escola é selecionada
    escolaSelect.addEventListener('change', function() {
        const escola = this.value;
        if (!escola) return;
        
        fetch('/api/get_school_classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ school: escola })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
                data.classes.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma;
                    option.textContent = turma;
                    turmaSelect.appendChild(option);
                });
                alunosTable.innerHTML = ''; // Limpa tabela de alunos
            }
        })
        .catch(error => {
            console.error('Erro ao carregar turmas:', error);
        });
    });
    
    // Carrega alunos quando turma é selecionada
    turmaSelect.addEventListener('change', function() {
        const escola = escolaSelect.value;
        const turma = this.value;
        if (!escola || !turma) return;
        
        fetch('/api/get_class', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                school: escola,
                class: turma 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alunosTable.innerHTML = '';
                data.alunos.forEach(aluno => {
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
    
    // Adicionar aluno manualmente (sua funcionalidade)
    addAlunoBtn.addEventListener('click', function() {
        const escola = escolaSelect.value;
        const turma = turmaSelect.value;
        
        if (!escola || !turma) {
            alert('Selecione uma escola e turma primeiro');
            return;
        }
        
        const nomeAluno = prompt('Digite o nome do aluno:');
        if (nomeAluno) {
            // Adiciona à tabela visual
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
                if (opcao === 'P') option.selected = true;
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
            
            // Atualiza estruturas de dados locais
            if (!appData.schools[escola]) {
                appData.schools[escola] = {};
            }
            if (!appData.schools[escola][turma]) {
                appData.schools[escola][turma] = [];
            }
            appData.schools[escola][turma].push(nomeAluno);
            
            if (!appData.attendance_status[turma]) {
                appData.attendance_status[turma] = {};
            }
            appData.attendance_status[turma][nomeAluno] = 'P';
            
            if (!appData.observations[turma]) {
                appData.observations[turma] = {};
            }
            appData.observations[turma][nomeAluno] = '';
        }
    });
    
    // Salvar chamada
    salvarChamadaBtn.addEventListener('click', function() {
        const escola = escolaSelect.value;
        const turma = turmaSelect.value;
        
        if (!escola || !turma) {
            alert('Selecione uma escola e turma primeiro');
            return;
        }
        
        const alunosData = [];
        const rows = alunosTable.rows;
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].cells;
            alunosData.push({
                nome: cells[0].textContent,
                presenca: cells[1].querySelector('select').value,
                observacao: cells[2].querySelector('input').value
            });
        }
        
        fetch('/api/save_attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                escola: escola,  // Adicionado escola
                turma: turma,
                alunos: alunosData
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Chamada salva com sucesso!');
                appData.saved_classes.add(turma);
            } else {
                alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Falha ao comunicar com o servidor');
        });
    });
    
    // Exportar para Excel
    exportarExcelBtn.addEventListener('click', function() {
        window.location.href = '/api/export_excel';
    });
    
    // Inicializa carregando as escolas
    carregarEscolas();
});