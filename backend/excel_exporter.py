from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
import io
from datetime import datetime
import re

def export_to_excel(classes, attendance_status, observations, html_content=None, current_user=None, periodo=None):
    """
    Exporta APENAS as turmas que foram explicitamente salvas
    
    Args:
        classes (dict): Dicionário com turmas e alunos
        attendance_status (dict): Status de presença por turma e aluno
        observations (dict): Observações por turma e aluno
        html_content (str, optional): Conteúdo HTML original para extrair nome da escola
        current_user (str, optional): Nome do usuário (dupla) que fez a chamada
        periodo (str, optional): Período (matutino/vespertino)
    
    Returns:
        io.BytesIO: Stream com o arquivo Excel em memória
    """
    # Cria um novo Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Lista de Presença"

    # Configuração do cabeçalho
    header_rows = [
        ("Período:", periodo or "Não informado"),
        ("Responsável pela Chamada:", current_user or "Não informado"),
        ("Data da Chamada:", datetime.now().strftime('%d/%m/%Y %H:%M'))
    ]

    # Adiciona as informações no cabeçalho
    for i, (label, value) in enumerate(header_rows, start=1):
        ws[f'A{i}'] = label
        ws[f'A{i}'].font = Font(bold=True)
        ws[f'B{i}'] = value
        ws.merge_cells(f'B{i}:D{i}')  # Mescla as colunas B, C e D para o valor

    current_row = len(header_rows) + 2  # Pula para depois do cabeçalho

    # Verifica se há turmas para exportar
    if not classes:
        # Se nenhuma turma foi salva, adiciona uma mensagem
        ws.merge_cells(f"A{current_row}:D{current_row}")
        ws[f"A{current_row}"] = "Nenhuma chamada salva encontrada"
        ws[f"A{current_row}"].font = Font(italic=True)
        current_row += 2
    else:
        # Itera apenas pelas turmas fornecidas (que já foram filtradas como salvas)
        for turma, alunos in classes.items():
            # Adiciona a linha da turma
            ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=4)
            ws.cell(row=current_row, column=1).value = f"Turma: {turma}"
            ws.cell(row=current_row, column=1).font = Font(bold=True, size=12)
            ws.cell(row=current_row, column=1).alignment = Alignment(horizontal="left")
            current_row += 1

            # Cabeçalho da tabela para a turma
            headers = ["Aluno", "Presença", "Observação"]
            for col, header in enumerate(headers, start=1):
                ws.cell(row=current_row, column=col).value = header
                ws.cell(row=current_row, column=col).font = Font(bold=True)
                ws.cell(row=current_row, column=col).alignment = Alignment(horizontal="center")
            current_row += 1

            # Para cada aluno da turma, adiciona os dados de presença e observação
            for student in alunos:
                ws.cell(row=current_row, column=1).value = student
                ws.cell(row=current_row, column=2).value = attendance_status.get(turma, {}).get(student, "P")
                ws.cell(row=current_row, column=3).value = observations.get(turma, {}).get(student, "")
                current_row += 1

            # Linha vazia entre turmas
            current_row += 1

    # Ajusta largura das colunas
    ws.column_dimensions["A"].width = 25  # Coluna dos rótulos
    ws.column_dimensions["B"].width = 30  # Coluna dos valores
    ws.column_dimensions["C"].width = 15  # Presença
    ws.column_dimensions["D"].width = 40  # Observação

    # Cria um stream em memória para o arquivo
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return output

def get_excel_filename():
    """Gera um nome de arquivo padrão para a exportação"""
    return f"Presenca_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"