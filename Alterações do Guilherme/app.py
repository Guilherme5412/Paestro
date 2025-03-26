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
app.secret_key = 'senha_ultramente_secreta'

# Dados em memória
app_data = {
    'schools': {},         # { 'NomeEscola': { 'Turma1': [alunos], ... }, ... }
    'selected_school': None,
    'selected_class': None,
    'attendance_status': {},  # { 'Turma1': { 'Aluno1': 'P', ... }, ... }
    'observations': {},       # { 'Turma1': { 'Aluno1': 'obs', ... }, ... }
    'file_uploaded': False,
    'html_content': {},       # { 'NomeEscola': <conteúdo HTML> }
    'current_user': None,
    'periodo': None,
    'saved_classes': set()   
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
    app_data['periodo'] = data.get('periodo')  # Armazena o período
    return jsonify({
        'success': True, 
        'username': app_data['current_user'],
        'periodo': app_data['periodo']  # Retorna o período para debug
    })

@app.route('/api/upload', methods=['POST'])
def handle_file_upload():
    if 'files' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'})
    
    files = request.files.getlist('files')
    if not files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    try:
        for file in files:
            if file.filename == '':
                continue
            html_content = file.read().decode('utf-8')
            
            # Nome da escola = nome do arquivo sem extensão
            school_name = os.path.splitext(file.filename)[0]
            classes_dict = parse_html_content(html_content)
            
            # Armazena no app_data
            if school_name not in app_data['schools']:
                app_data['schools'][school_name] = {}
            app_data['schools'][school_name].update(classes_dict)
            app_data['html_content'][school_name] = html_content
            
            # Inicializa attendance_status e observations para cada turma
            for turma, alunos in classes_dict.items():
                if turma not in app_data['attendance_status']:
                    app_data['attendance_status'][turma] = {}
                if turma not in app_data['observations']:
                    app_data['observations'][turma] = {}
                
                for aluno in alunos:
                    if aluno not in app_data['attendance_status'][turma]:
                        app_data['attendance_status'][turma][aluno] = 'P'
                    if aluno not in app_data['observations'][turma]:
                        app_data['observations'][turma][aluno] = ''
        
        app_data['file_uploaded'] = True
        return jsonify({
            'success': True,
            'schools': list(app_data['schools'].keys()),
            'message': 'Arquivos processados com sucesso'
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get_schools', methods=['GET'])
def get_schools():
    return jsonify({
        'success': True,
        'schools': list(app_data['schools'].keys())
    })

@app.route('/api/get_school_classes', methods=['POST'])
def get_school_classes():
    data = request.get_json()
    school = data.get('school')
    
    if not school or school not in app_data['schools']:
        return jsonify({'success': False, 'error': 'Escola não encontrada'})
    
    return jsonify({
        'success': True,
        'classes': list(app_data['schools'][school].keys())
    })

@app.route('/api/get_class', methods=['POST'])
def get_class_data():
    data = request.get_json()
    school = data.get('school')
    turma = data.get('class')
    
    if not school or school not in app_data['schools']:
        return jsonify({'success': False, 'error': 'Escola não encontrada'})
    if turma not in app_data['schools'][school]:
        return jsonify({'success': False, 'error': 'Turma não encontrada'})
    
    alunos_data = []
    for aluno in app_data['schools'][school][turma]:
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

@app.route('/api/get_turmas', methods=['GET'])
def get_turmas():
    return jsonify({
        'success': True,
        'turmas': list(app_data.get('classes', {}).keys())
    })

@app.route('/api/save_attendance', methods=['POST'])
def save_attendance_data():
    data = request.json
    escola = data.get('escola')
    turma = data.get('turma')
    alunos = data.get('alunos')
    
    if not all([escola, turma, alunos]):
        return jsonify({'success': False, 'error': 'Dados incompletos'})
    
    try:
        # Verifica se a turma pertence à escola
        if escola not in app_data['schools'] or turma not in app_data['schools'][escola]:
            return jsonify({'success': False, 'error': 'Turma não encontrada na escola especificada'})
        
        # Garante que as estruturas existam
        if turma not in app_data['attendance_status']:
            app_data['attendance_status'][turma] = {}
        if turma not in app_data['observations']:
            app_data['observations'][turma] = {}
        
        # Atualiza os dados
        for aluno in alunos:
            nome = aluno['nome']
            app_data['attendance_status'][turma][nome] = aluno['presenca']
            app_data['observations'][turma][nome] = aluno['observacao']
        
        app_data['saved_classes'].add(turma)
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/export_excel', methods=['GET'])
def export_attendance():
    try:
        if not app_data['saved_classes']:
            return jsonify({'success': False, 'error': 'Nenhuma turma salva para exportação'})
        
        # Prepara os dados para exportação
        classes_to_export = {}
        attendance_to_export = {}
        observations_to_export = {}
        
        for turma in app_data['saved_classes']:
            # Encontra a escola da turma
            escola = None
            for escola_name, turmas in app_data['schools'].items():
                if turma in turmas:
                    escola = escola_name
                    break
            
            if escola:
                classes_to_export[turma] = app_data['schools'][escola][turma]
                attendance_to_export[turma] = app_data['attendance_status'].get(turma, {})
                observations_to_export[turma] = app_data['observations'].get(turma, {})
        
        # Obtém o período do usuário
        periodo = request.args.get('periodo') or app_data.get('periodo', 'Não informado')
        
        # Gera o Excel
        output = export_to_excel(
            classes_to_export,
            attendance_to_export,
            observations_to_export,
            app_data['html_content'],
            app_data['current_user'],
            periodo
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