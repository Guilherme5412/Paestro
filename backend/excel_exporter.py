from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
import io
from datetime import datetime

def export_to_excel(classes, attendance_status, observations, html_content=None, current_user=None, periodo=None):
    wb = Workbook()
    ws = wb.active
    ws.title = "Lista de Presença"

    # Cabeçalho com informações gerais
    header_rows = [
        ("Unidade:", "Não informado"),
        ("Responsáveis:", current_user or "Não informado"),
        ("Período:", periodo or "Não informado"),
        ("Data e hora:", datetime.now().strftime('%d/%m/%Y %H:%M'))
    ]

    for i, (label, value) in enumerate(header_rows, start=1):
        ws[f'A{i}'] = label
        ws[f'A{i}'].font = Font(bold=True)
        ws[f'B{i}'] = value
        ws.merge_cells(f'B{i}:D{i}')

    current_row = len(header_rows) + 2

    if not classes:
        ws.merge_cells(f"A{current_row}:D{current_row}")
        ws[f"A{current_row}"] = "Nenhuma chamada salva encontrada"
        ws[f"A{current_row}"].font = Font(italic=True)
    else:
        for turma, alunos in classes.items():
            # Cabeçalho da turma
            ws.merge_cells(f"A{current_row}:D{current_row}")
            ws[f"A{current_row}"] = f"Turma: {turma}"
            ws[f"A{current_row}"].font = Font(bold=True, size=12)
            current_row += 1

            # Cabeçalho da tabela
            headers = ["Aluno", "Presença", "Observação"]
            for col, header in enumerate(headers, start=1):
                ws.cell(row=current_row, column=col).value = header
                ws.cell(row=current_row, column=col).font = Font(bold=True)
            current_row += 1

            # Dados dos alunos
            for aluno in alunos:
                ws.cell(row=current_row, column=1).value = aluno
                ws.cell(row=current_row, column=2).value = attendance_status.get(turma, {}).get(aluno, "P")
                ws.cell(row=current_row, column=3).value = observations.get(turma, {}).get(aluno, "")
                current_row += 1

            current_row += 1  # Espaço entre turmas

    # Ajuste de colunas
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 15
    ws.column_dimensions["C"].width = 40

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output

def get_excel_filename():
    return f"Presenca_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"