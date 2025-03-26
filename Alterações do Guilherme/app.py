from flask import Flask, request, jsonify, send_file, render_template
from datetime import datetime
import os
import re
from attendance_parser import parse_html_content
from excel_exporter import export_to_excel, get_excel_filename

app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates'),
            static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static'))

app.config['TEMPLATES_AUTO_RELOAD'] = True
app.secret_key = 'sua_chave_secreta_aqui'

app_data = {
    'schools': {},         # { 'NomeEscola': { 'Turma1': [alunos], ... }, ... }
    'selected_school': None,
    'selected_class': None,
    # Armazenamos presenças e observações por T U R M A
    'attendance_status': {},  # { 'Turma1': { 'Aluno1': 'P', ... }, ... }
    'observations': {},       # { 'Turma1': { 'Aluno1': 'obs', ... }, ... }
    'file_uploaded': False,
    'html_content': {},       # { 'NomeEscola': <conteúdo HTML> }
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

# ---------- API Endpoints ----------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    app_data['current_user'] = data.get('username')
    return jsonify({'success': True, 'username': app_data['current_user']})

@app.route('/api/upload', methods=['POST'])
def handle_file_upload():
    # Recebe vários arquivos no campo "files"
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
    """
    Retorna a lista de escolas que já foram importadas.
    """
    return jsonify({
        'success': True,
        'schools': list(app_data['schools'].keys())
    })

@app.route('/api/get_school_classes', methods=['POST'])
def get_school_classes():
    """
    Dado o nome de uma escola, retorna as turmas disponíveis.
    """
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
    """
    Dada a escola e a turma, retorna os alunos e suas presenças/observações.
    """
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

@app.route('/api/save_attendance', methods=['POST'])
def save_attendance_data():
    """
    Salva a presença dos alunos de uma determinada turma.
    (Aqui não estamos usando 'school', mas poderíamos se quisermos.)
    """
    data = request.json
    turma = data.get('turma')
    alunos = data.get('alunos')
    
    if turma not in app_data['attendance_status']:
        return jsonify({'success': False, 'error': 'Turma não encontrada'})
    
    try:
        for aluno in alunos:
            nome_aluno = aluno['nome']
            app_data['attendance_status'][turma][nome_aluno] = aluno['presenca']
            app_data['observations'][turma][nome_aluno] = aluno['observacao']
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/export_excel', methods=['GET'])
def export_attendance():
    """
    Exporta todas as escolas/turmas para um único Excel.
    """
    try:
        output = export_to_excel(
            app_data['schools'],
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
    app.run(debug=True, port=5000)
