const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzULh4NzIHPnxMlMFilTvZ9Lyr85y9bSm1Fb9YnfRktmO2vZxPdZNsC0HnBz-yU2BS2/exec";
const ADMIN_PASSWORD = "CIPA2526";

// Carrega o arquivo MP3 local
const audioUrna = new Audio("urna.mp3");
audioUrna.load();

function tocarSomUrna() {
  audioUrna.currentTime = 0;
  audioUrna.play().catch(err => console.warn("Não foi possível reproduzir o áudio:", err));
}

// ----- LISTA FIXA DE CANDIDATOS -----
const CANDIDATOS_FIXOS = [
  // CCO / MOGI-ALPHA / MOGI-BRAVO
  { nome: "MARIA COELHO DE OLIVEIRA", apelido: "MARIA", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "ADMINISTRATIVO" },
  { nome: "LUIZ FERNANDO DONIZETI DE FREITAS", apelido: "CAZÃO", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "MARKETING" },
  { nome: "SERGIO JANUÁRIO DE SOUSA JUNIOR", apelido: "", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "LOGÍSTICA" },
  { nome: "JEFFERSON DANIEL DA SILVA", apelido: "", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "ESTOQUE" },
  { nome: "HENDERSON APARECIDO TOMAZ FERREIRA", apelido: "HENDERSON TOMAZ", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "INSTALAÇÃO" },
  { nome: "GABRIEL HENRIQUE ANDRADE MIGUEL", apelido: "BIEL", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "INSTALAÇÃO" },
  { nome: "PEDRO HENRIQUE RIBEIRO DE BRITO", apelido: "", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "INSTALAÇÃO" },
  { nome: "PAULO HENRIQUE DOS SANTOS", apelido: "PAULO", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "INSTALAÇÃO" },
  { nome: "LUCAS NASCIMENTO DA SILVA", apelido: "BAHIA", unidade: "CCO / MOGI-ALPHA / MOGI-BRAVO", setor: "INSTALAÇÃO" },

  // INDAIATUBA
  { nome: "JOÃO VITOR APARECIDO SOLEDADE", apelido: "", unidade: "INDAIATUBA", setor: "INSTALAÇÃO" },
  { nome: "LEONARDO PAURA ALEXANDRE", apelido: "", unidade: "INDAIATUBA", setor: "INSTALAÇÃO" },
  { nome: "RUAN LIMA DIAS", apelido: "", unidade: "INDAIATUBA", setor: "VISTORIA" },
  { nome: "PABLO FABRÍCIO CAVALCANTE DA COSTA", apelido: "", unidade: "INDAIATUBA", setor: "INSTALAÇÃO" },
  { nome: "MAICON CRIATIAN DA SILVA", apelido: "ZÉ", unidade: "INDAIATUBA", setor: "VISTORIA" },
  { nome: "RUAN XAVIER", apelido: "RUANZINHO", unidade: "INDAIATUBA", setor: "VISTORIA" },
  { nome: "LUIS MIGUEL LIMA OLIVEIRA", apelido: "LUIS MIGUEL", unidade: "INDAIATUBA", setor: "VISTORIA" },
  { nome: "GABRIEL RIBEIRO CATALANO", apelido: "CATALANO", unidade: "INDAIATUBA", setor: "ESTOQUE" },

  // SÃO CARLOS
  { nome: "ALESSANDO MIGUEL DA SILVA", apelido: "ALE", unidade: "SÃO CARLOS", setor: "INSTALAÇÃO" },
  { nome: "MIGUEL SALVADOR", apelido: "", unidade: "SÃO CARLOS", setor: "INSTALAÇÃO" }
];

document.addEventListener("DOMContentLoaded", () => {
  setupUnitCheckboxHandlers();
  carregarCandidatos();

  document.body.addEventListener('click', () => {
    audioUrna.load();
  }, { once: true });
});

// ----- MANIPULAÇÃO DAS UNIDADES -----
function setupUnitCheckboxHandlers() {
  const unidadeCheckboxes = Array.from(document.querySelectorAll('input[name="unidadeEleitor"]'));
  unidadeCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        unidadeCheckboxes.forEach(other => {
          if (other !== cb) other.checked = false;
        });
        document.getElementById("candidatos-container").classList.remove("hidden");
      } else {
        document.getElementById("candidatos-container").classList.add("hidden");
      }
      carregarCandidatos();
    });
  });
}

// ----- LOGIN ADMIN -----
function loginAdmin() {
  const senha = document.getElementById("adminPassword").value;
  if (senha === ADMIN_PASSWORD) {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("votacao-section").classList.add("hidden");
    document.getElementById("admin-section").classList.remove("hidden");
    document.getElementById("adminPassword").value = "";

    carregarApuracao();
  } else {
    alert("Senha incorreta!");
  }
}

function sairAdmin() {
  document.getElementById("admin-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("votacao-section").classList.remove("hidden");
}

// ----- LIMPAR CPFs (ÁREA ADMIN) -----
function limparCPFs() {
  if (confirm("Tem certeza que deseja apagar o registro local de CPFs votantes neste computador?")) {
    localStorage.removeItem("cpfsVotaram");
    alert("Histórico de CPFs votantes zerado com sucesso!");
  }
}

// ----- CONSULTAR E EXIBIR APURAÇÃO EM TEMPO REAL -----
function carregarApuracao() {
  const statusEl = document.getElementById("statusApuracao");
  const listaEl = document.getElementById("listaCandidatos");

  if (statusEl) statusEl.textContent = "Buscando dados da planilha...";
  if (listaEl) listaEl.innerHTML = "";

  fetch(SCRIPT_URL)
    .then(res => res.json())
    .then(data => {
      if (data.status === "error") throw new Error(data.message);

      const votos = data.votos || {};
      if (statusEl) statusEl.textContent = "Apuração atualizada com sucesso!";

      listaEl.innerHTML = "";
      let totalVotosGeral = 0;

      CANDIDATOS_FIXOS.forEach(c => {
        const totalCandidato = votos[c.nome] || 0;
        totalVotosGeral += totalCandidato;

        const li = document.createElement("li");
        li.innerHTML = `
          <span><strong>${escapeHtml(c.nome)}</strong> (${escapeHtml(c.unidade)})</span>
          <span style="background: #ffcc00; color: #000; padding: 2px 8px; border-radius: 10px; font-weight: bold;">${totalCandidato} voto(s)</span>
        `;
        listaEl.appendChild(li);
      });

      const totalLi = document.createElement("li");
      totalLi.style.fontWeight = "bold";
      totalLi.style.borderTop = "2px solid #ffcc00";
      totalLi.style.marginTop = "10px";
      totalLi.style.background = "rgba(255, 204, 0, 0.2)";
      totalLi.innerHTML = `<span>TOTAL DE VOTOS REGISTRADOS</span> <span>${totalVotosGeral}</span>`;
      listaEl.appendChild(totalLi);
    })
    .catch(err => {
      console.error("Erro na apuração:", err);
      if (statusEl) statusEl.textContent = "Não foi possível carregar a apuração no momento.";
    });
}

// ----- VOTAÇÃO E ENVIO DE DADOS -----
document.getElementById("voteForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const btnVotar = e.target.querySelector('button[type="submit"]');
  const btnOriginalText = btnVotar.textContent;
  btnVotar.disabled = true;
  btnVotar.textContent = "Registrando voto...";

  const nome = document.getElementById("nome").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const candidatoNome = document.getElementById("candidato").value;
  const selectedUnitEl = document.querySelector('input[name="unidadeEleitor"]:checked');
  const unidadeEleitor = selectedUnitEl ? selectedUnitEl.value : "";

  if (!candidatoNome) { alert("Selecione um candidato!"); resetButton(); return; }
  if (!unidadeEleitor) { alert("Selecione sua unidade!"); resetButton(); return; }

  let cpfsVotaram = JSON.parse(localStorage.getItem("cpfsVotaram")) || [];
  if (cpfsVotaram.includes(cpf)) { alert("Este CPF já registrou um voto!"); resetButton(); return; }

  const candidatoObj = CANDIDATOS_FIXOS.find(c => c.nome === candidatoNome);
  if (!candidatoObj) { alert("Candidato não encontrado!"); resetButton(); return; }

  const formData = new URLSearchParams();
  formData.append("Nome", nome);
  formData.append("CPF", cpf);
  formData.append("Unidade", unidadeEleitor);
  formData.append("Candidato", candidatoObj.nome);
  formData.append("Apelido", candidatoObj.apelido);
  formData.append("Setor", candidatoObj.setor);

  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString()
  })
  .then(() => {
    cpfsVotaram.push(cpf);
    localStorage.setItem("cpfsVotaram", JSON.stringify(cpfsVotaram));

    // Exibe o modal da imagem
    const modal = document.getElementById("modalSucesso");
    modal.classList.remove("hidden");

    // Toca o som exatamente no momento em que a imagem abre
    tocarSomUrna();

    setTimeout(() => {
      modal.classList.add("hidden");
      document.getElementById("voteForm").reset();
      document.getElementById("candidatos-container").classList.add("hidden");
      carregarCandidatos();
      resetButton();
    }, 2500);
  })
  .catch(err => {
    console.error("Erro no envio:", err);
    alert("Falha ao enviar voto. Verifique a conexão.");
    resetButton();
  });

  function resetButton() {
    btnVotar.disabled = false;
    btnVotar.textContent = btnOriginalText;
  }
});

// ----- CARREGAR CANDIDATOS -----
function carregarCandidatos() {
  const candidatosAll = CANDIDATOS_FIXOS;
  const tabelaBody = document.querySelector("#tabelaCandidatos tbody");
  const selectExcluir = document.getElementById("candidatoExcluir");

  const selectedUnitEl = document.querySelector('input[name="unidadeEleitor"]:checked');
  const unidadeSelecionada = selectedUnitEl ? selectedUnitEl.value.trim().toLowerCase() : "";

  let candidatosFiltrados = candidatosAll.filter(c => c && c.nome);
  if (unidadeSelecionada) {
    candidatosFiltrados = candidatosFiltrados.filter(c => (c.unidade || "").toString().trim().toLowerCase() === unidadeSelecionada);
  }

  if (tabelaBody) {
    tabelaBody.innerHTML = "";
    if (!unidadeSelecionada) return;

    if (candidatosFiltrados.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5">Nenhum candidato disponível para a unidade selecionada.</td>`;
      tabelaBody.appendChild(tr);
      document.getElementById("candidato").value = "";
    } else {
      candidatosFiltrados.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="checkbox" name="selecionarCandidato" value="${escapeHtml(c.nome)}"></td>
          <td>${escapeHtml(c.nome)}</td>
          <td>${escapeHtml(c.apelido)}</td>
          <td>${escapeHtml(c.unidade)}</td>
          <td>${escapeHtml(c.setor)}</td>
        `;
        tabelaBody.appendChild(tr);
      });

      tabelaBody.querySelectorAll('input[name="selecionarCandidato"]').forEach(cb => {
        cb.addEventListener('change', function() {
          tabelaBody.querySelectorAll('input[name="selecionarCandidato"]').forEach(other => {
            if (other !== cb) other.checked = false;
          });
          document.getElementById("candidato").value = cb.checked ? cb.value : "";
        });
      });
    }
  }

  if (selectExcluir) {
    selectExcluir.innerHTML = "<option value='' disabled selected>Selecione</option>";
    candidatosAll.forEach(c => {
      const option = document.createElement("option");
      option.value = c.nome;
      option.textContent = c.nome;
      selectExcluir.appendChild(option);
    });
  }
}

// ----- ESCAPE HTML -----
function escapeHtml(text) {
  if (text === undefined || text === null) return "";
  return text.toString().replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;"
    }[s]);
  });
}
