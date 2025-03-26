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
  
    // Prevenir comportamentos padrão para drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Highlight drop area quando arrastando
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });
    
    // Lidar com drop
    dropArea.addEventListener('drop', handleDrop, false);
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) {
        handleFiles(files);
      }
    }
  
    // Botão de selecionar arquivo
    browseBtn.addEventListener('click', function() {
      fileInput.click();
    });
  
    fileInput.addEventListener('change', function() {
      if (this.files.length) {
        handleFiles(this.files);
      }
    });
  
    // Armazena os arquivos selecionados
    let selectedFiles = [];
  
    function handleFiles(files) {
      const fileArray = Array.from(files);
  
      // Filtra só .html / .htm
      const validFiles = fileArray.filter(file => file.name.match(/\.(html|htm)$/i));
      if (!validFiles.length) {
        alert('Por favor, selecione arquivos HTML');
        return;
      }
  
      // Acumula os arquivos
      selectedFiles = selectedFiles.concat(validFiles);
  
      // Mostra todos os nomes
      fileInfo.style.display = 'block';
      fileName.textContent = selectedFiles.map(f => f.name).join(', ');
  
      // Botão para processar
      processBtn.onclick = function() {
        processAllFiles(selectedFiles);
      };
    }
  
    function processAllFiles(files) {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
  
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          escolasCount.textContent = data.schools.length;
          results.style.display = 'block';
          fileInfo.style.display = 'none';
          selectedFiles = []; // limpa a lista de arquivos
          console.log('Escolas importadas:', data.schools);
        } else {
          alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
      })
      .catch(error => {
        console.error('Erro no processamento:', error);
        alert('Erro ao comunicar com o servidor');
      });
    }
  
    goToChamadaBtn.addEventListener('click', function() {
      window.location.href = '/chamada';
    });
  });
  