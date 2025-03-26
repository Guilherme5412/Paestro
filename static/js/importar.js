document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const processBtn = document.getElementById('process-btn');
    const results = document.getElementById('results');
    const turmasCount = document.getElementById('turmas-count');
    const alunosCount = document.getElementById('alunos-count');
    const goToChamadaBtn = document.getElementById('go-to-chamada');
    
    // Prevenir comportamentos padrão para drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }
    
    // Handle file selection via button
    browseBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFiles(this.files);
        }
    });
    
    function handleFiles(files) {
        const file = files[0];
        
        // Verifica se é um arquivo HTML
        if (!file.name.match(/\.(html|htm)$/i)) {
            alert('Por favor, selecione um arquivo HTML');
            return;
        }
        
        // Exibe informações do arquivo
        fileName.textContent = file.name;
        fileInfo.style.display = 'block';
        
        // Configura o botão de processar
        processBtn.onclick = function() {
            processFile(file);
        };
    }
    
    function processFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const formData = new FormData();
            formData.append('file', file);
            
            fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    turmasCount.textContent = data.classes.length;
                    alunosCount.textContent = data.count;
                    results.style.display = 'block';
                    fileInfo.style.display = 'none';
                    
                    // Armazena as turmas no localStorage
                    localStorage.setItem('turmas_disponiveis', JSON.stringify(data.classes));
                    
                    // Exibe mensagem com os primeiros nomes de turma para debug
                    const primeirasTurmas = data.classes.slice(0, 3).join(', ');
                    console.log('Turmas processadas:', primeirasTurmas + (data.classes.length > 3 ? '...' : ''));
                } else {
                    alert('Erro: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Erro no processamento:', error);
                alert('Erro ao comunicar com o servidor');
            });
        };
        
        reader.readAsText(file);
    }
    
    goToChamadaBtn.addEventListener('click', function() {
        window.location.href = '/chamada';
    });
});