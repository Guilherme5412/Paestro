document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const processBtn = document.getElementById('process-btn');
    const results = document.getElementById('results');
    const escolasCount = document.getElementById('escolas-count');
    const goToChamadaBtn = document.getElementById('go-to-chamada');
    
    // Estado para armazenar arquivos selecionados
    let selectedFiles = [];
    
    // Prevenir comportamentos padrão para drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area
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
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });
    
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
        // Converte FileList para array e filtra apenas HTML
        const fileArray = Array.from(files).filter(file => 
            file.name.match(/\.(html|htm)$/i)
        );
        
        if (fileArray.length === 0) {
            alert('Por favor, selecione arquivos HTML (.html ou .htm)');
            return;
        }
        
        // Atualiza lista de arquivos selecionados
        selectedFiles = fileArray;
        
        // Atualiza UI
        fileInfo.style.display = 'block';
        fileName.textContent = selectedFiles.map(f => f.name).join(', ');
        
        // Configura o botão de processar
        processBtn.onclick = processSelectedFiles;
    }
    
    function processSelectedFiles() {
        if (selectedFiles.length === 0) {
            alert('Nenhum arquivo válido selecionado');
            return;
        }
        
        // Mostra loading
        processBtn.disabled = true;
        processBtn.textContent = 'Processando...';
        
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Atualiza UI com resultados
                escolasCount.textContent = data.schools.length;
                results.style.display = 'block';
                fileInfo.style.display = 'none';
                
                // Limpa seleção após sucesso
                selectedFiles = [];
                fileInput.value = '';
                
                // Armazena escolas no localStorage se necessário
                localStorage.setItem('ultimas_escolas', JSON.stringify(data.schools));
            } else {
                throw new Error(data.error || 'Erro desconhecido no processamento');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert(`Falha no processamento: ${error.message}`);
        })
        .finally(() => {
            processBtn.disabled = false;
            processBtn.textContent = 'Processar Arquivos';
        });
    }
    
    goToChamadaBtn.addEventListener('click', function() {
        window.location.href = '/chamada';
    });
    
    // Melhoria: Focar na área de drop quando a página carrega
    dropArea.focus();
});