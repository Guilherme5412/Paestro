document.addEventListener("DOMContentLoaded", () => {
    const selectEscola = document.getElementById("select-escola");
    const selectTurma = document.getElementById("select-turma");
    const tableBody = document.querySelector("#table-alunos tbody");
    const btnSalvar = document.getElementById("btn-salvar");
    const btnExportar = document.getElementById("btn-exportar");
  
    // 1. Carregar lista de escolas
    fetch("/api/get_schools")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          data.schools.forEach(escola => {
            const opt = document.createElement("option");
            opt.value = escola;
            opt.textContent = escola;
            selectEscola.appendChild(opt);
          });
        } else {
          console.error("Erro ao carregar escolas:", data.error);
        }
      })
      .catch(console.error);
  
    // 2. Ao mudar a escola, carrega as turmas
    selectEscola.addEventListener("change", () => {
      const escola = selectEscola.value;
      if (!escola) return;
  
      // Limpa as turmas antigas e a tabela de alunos
      selectTurma.innerHTML = "<option value=''>Selecione a turma</option>";
      tableBody.innerHTML = "";
  
      fetch("/api/get_school_classes", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({school: escola})
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          data.classes.forEach(turma => {
            const opt = document.createElement("option");
            opt.value = turma;
            opt.textContent = turma;
            selectTurma.appendChild(opt);
          });
        } else {
          alert("Erro ao carregar turmas: " + data.error);
        }
      })
      .catch(console.error);
    });
  
    // 3. Ao mudar a turma, carrega os alunos
    selectTurma.addEventListener("change", () => {
      const escola = selectEscola.value;
      const turma = selectTurma.value;
      if (!escola || !turma) return;
  
      // Limpa a tabela
      tableBody.innerHTML = "";
  
      fetch("/api/get_class", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({school: escola, class: turma})
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Preenche a tabela
          data.alunos.forEach(al => {
            const tr = document.createElement("tr");
            const tdNome = document.createElement("td");
            const tdPresenca = document.createElement("td");
            const tdObs = document.createElement("td");
  
            tdNome.textContent = al.nome;
  
            // Se quiser Radio: P, F, FJ
            // Mas aqui vou usar <select>
            const selectPresenca = document.createElement("select");
            ["P", "F", "FJ"].forEach(status => {
              const opt = document.createElement("option");
              opt.value = status;
              opt.textContent = status;
              if (status === al.presenca) opt.selected = true;
              selectPresenca.appendChild(opt);
            });
            tdPresenca.appendChild(selectPresenca);
  
            const inputObs = document.createElement("input");
            inputObs.type = "text";
            inputObs.value = al.observacao || "";
            tdObs.appendChild(inputObs);
  
            tr.appendChild(tdNome);
            tr.appendChild(tdPresenca);
            tr.appendChild(tdObs);
            tableBody.appendChild(tr);
          });
        } else {
          alert("Erro ao carregar turma: " + data.error);
        }
      })
      .catch(console.error);
    });
  
    // 4. Salvar a chamada
    btnSalvar.addEventListener("click", () => {
      const escola = selectEscola.value;
      const turma = selectTurma.value;
      if (!escola || !turma) {
        alert("Selecione a escola e a turma antes de salvar.");
        return;
      }
  
      // Montar a lista de alunos
      const rows = tableBody.querySelectorAll("tr");
      const alunos = [];
      rows.forEach(row => {
        const nome = row.cells[0].textContent;
        const presenca = row.cells[1].querySelector("select").value;
        const observacao = row.cells[2].querySelector("input").value;
        alunos.push({nome, presenca, observacao});
      });
  
      fetch("/api/save_attendance", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({turma, alunos})
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Presença salva com sucesso!");
        } else {
          alert("Erro ao salvar presença: " + data.error);
        }
      })
      .catch(console.error);
    });
  
    // 5. Exportar para Excel
    btnExportar.addEventListener("click", () => {
      window.location.href = "/api/export_excel";
    });
  });
  