// Cache de elementos DOM
const DOM = {
    elements: {},
    init: function() {
        this.elements = {
            salvarDriveBtn: document.getElementById('salvar-drive-btn'),
            baixarExcelBtn: document.getElementById('baixar-excel-btn'),
            pastaDriveSelect: document.getElementById('pasta-drive'),
            dataAtualElement: document.getElementById('data-atual'),
            nomeUsuarioElement: document.getElementById('nome-usuario')
        };
        return this.elements;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const {
        salvarDriveBtn,
        baixarExcelBtn,
        pastaDriveSelect,
        dataAtualElement,
        nomeUsuarioElement
    } = DOM.init();

    // Inicialização
    updateCurrentDate();
    loadCurrentUser();
    setupEventListeners();

    // Atualiza a data atual
    function updateCurrentDate() {
        const hoje = new Date();
        dataAtualElement.textContent = hoje.toLocaleDateString('pt-BR');
    }

    // Carrega o usuário atual
    function loadCurrentUser() {
        fetch('/api/get_current_user')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const username = data.username || sessionStorage.getItem('paestro_usuario_temp') || '';
                    nomeUsuarioElement.textContent = username;
                }
            })
            .catch(error => {
                console.error('Erro ao obter usuário:', error);
                nomeUsuarioElement.textContent = sessionStorage.getItem('paestro_usuario_temp') || '';
            });
    }

    // Salvar no Google Drive
    function salvarNoDrive() {
        const pastaSelecionada = pastaDriveSelect.value;
        alert(`Funcionalidade em desenvolvimento. Arquivo será salvo na pasta: ${pastaSelecionada || 'Minha Unidade'}`);
        // Implementação futura
    }

    // Baixar Excel
    function baixarExcel() {
        // Obter a escola selecionada
        const escola = sessionStorage.getItem('escola_selecionada') || '';
        window.location.href = `/api/export_excel?escola=${encodeURIComponent(escola)}`;
    }

    // Configura os event listeners
    function setupEventListeners() {
        salvarDriveBtn.addEventListener('click', salvarNoDrive);
        baixarExcelBtn.addEventListener('click', baixarExcel);
    }
});