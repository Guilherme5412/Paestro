from flask import Flask, request, jsonify, send_file, render_template
from datetime import datetime
import os
import re
from attendance_parser import parse_html_content
from excel_exporter import export_to_excel, get_excel_filename

# Inicializa o Flask com caminhos absolutos
app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates'),
            static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static'))

# Configurações
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.secret_key = 'sua_chave_secreta_aqui'

# Dados em memória
app_data = {
    'classes': {},
    'selected_class': None,
    'students': [],
    'attendance_status': {},
    'observations': {},
    'file_uploaded': False,
    'html_content': None,
    'current_user': None
}

@app.route('/')
def home():
    return render_template('index.html', now=datetime.now())

@app.route('/importar')
def import_page():
    return render_template('importar.html')

@app.route('/chamada')
def attendance_page():
    return render_template('chamada.html',
                         current_user=app_data['current_user'],
                         current_date=datetime.now().strftime('%d/%m/%Y'))

# API Endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    app_data['current_user'] = data.get('username')
    return jsonify({'success': True, 'username': app_data['current_user']})

@app.route('/api/upload', methods=['POST'])
def handle_file_upload():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nome de arquivo vazio'})
    
    try:
        html_content = file.read().decode('utf-8')
        classes_dict = parse_html_content(html_content)
        
        # Converte o dicionário para lista de turmas
        turmas = list(classes_dict.keys())
        
        # Atualiza os dados da aplicação
        app_data['html_content'] = html_content
        app_data['classes'] = classes_dict
        app_data['file_uploaded'] = True
        
        # Inicializa estruturas de presença
        app_data['attendance_status'] = {turma: {aluno: 'P' for aluno in alunos} 
                                       for turma, alunos in classes_dict.items()}
        app_data['observations'] = {turma: {aluno: '' for aluno in alunos} 
                                  for turma, alunos in classes_dict.items()}
        
        return jsonify({
            'success': True,
            'classes': turmas,  # Agora enviando a lista de turmas
            'count': sum(len(alunos) for alunos in classes_dict.values()),
            'message': 'Arquivo processado com sucesso'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get_class', methods=['POST'])
def get_class_data():
    data = request.get_json()
    if not data or 'class' not in data:
        return jsonify({'success': False, 'error': 'Dados inválidos'})
    
    turma = data['class']
    if turma not in app_data.get('classes', {}):
        return jsonify({'success': False, 'error': 'Turma não encontrada'})
    
    # Garante que as estruturas de dados existam
    if turma not in app_data['attendance_status']:
        app_data['attendance_status'][turma] = {}
    if turma not in app_data['observations']:
        app_data['observations'][turma] = {}
    
    alunos_data = []
    for aluno in app_data['classes'][turma]:
        alunos_data.append({
            'nome': aluno,
            'presenca': app_data['attendance_status'][turma].get(aluno, 'P'),
            'observacao': app_data['observations'][turma].get(aluno, '')
        })
    
    return jsonify({
        'success': True,
        'alunos': alunos_data,
        'turma': turma,
        'total_alunos': len(alunos_data)
    })

# Adicione este novo endpoint para obter apenas a lista de turmas
@app.route('/api/get_turmas', methods=['GET'])
def get_turmas():
    return jsonify({
        'success': True,
        'turmas': list(app_data.get('classes', {}).keys())
    })

@app.route('/api/save_attendance', methods=['POST'])
def save_attendance_data():
    data = request.json
    turma = data.get('turma')
    alunos = data.get('alunos')
    
    if turma not in app_data['classes']:
        return jsonify({'success': False, 'error': 'Turma não encontrada'})
    
    try:
        for aluno in alunos:
            app_data['attendance_status'][turma][aluno['nome']] = aluno['presenca']
            app_data['observations'][turma][aluno['nome']] = aluno['observacao']
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/export_excel', methods=['GET'])
def export_attendance():
    try:
        output = export_to_excel(
            app_data['classes'],
            app_data['attendance_status'],
            app_data['observations'],
            app_data['html_content']
        )
        file_name = get_excel_filename()
        
        return send_file(
            output,
            as_attachment=True,
            download_name=file_name,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    # Verifica os caminhos antes de iniciar
    print(f"Template folder: {app.template_folder}")
    print(f"Static folder: {app.static_folder}")
    print(f"Templates existentes: {os.listdir(app.template_folder)}")
    
    app.run(debug=True, port=5000)