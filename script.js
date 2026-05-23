const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5195';

function entrarNoSistema() {
  document.getElementById('landing').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';

  iniciarRelogio();
  carregarAlunos(); // carrega a tabela ao entrar
}

function voltarParaLanding() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('landing').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function go(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  if (btn) {
    btn.classList.add('active');
    // move focus to the page title for screen readers/keyboard users
    const title = document.querySelector('.page.active .page-title');
    if (title) title.focus();
    return;
  }

  document.querySelectorAll('.nav-btn').forEach(b => {
    const t = b.textContent.toLowerCase();
    if (id === 'cadastro' && t.includes('novo')) {
      b.classList.add('active');
    } else if (id !== 'cadastro' && t.includes(id)) {
      b.classList.add('active');
    }
  });

  const title = document.querySelector('.page.active .page-title');
  if (title) title.focus();
}

let relogioIniciado = false;

function iniciarRelogio() {
  if (relogioIniciado) return;
  relogioIniciado = true;

  function atualizar() {
    const agora = new Date();
    const txt = agora.toLocaleString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    document.getElementById('data-tempo-real').textContent =
      txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  atualizar();
  setInterval(atualizar, 1000);
}

async function cadastrarAluno() {
  const nome = document.getElementById('f-nome').value.trim();
  const cpf = document.getElementById('f-cpf').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const telefone = document.getElementById('f-tel').value.trim();
  const plano = document.getElementById('f-plano').value;
  const instrutor = document.getElementById('f-inst').value;
  const observacoes = document.getElementById('f-obs').value.trim();

  // Validação básica
  if (!nome) { alert('Preencha o nome do aluno.'); return; }
  if (!cpf) { alert('Preencha o CPF.'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('E-mail inválido.'); return; }

  const aluno = { nome, cpf, email, telefone, plano, instrutor, observacoes };

  try {
    const resposta = await fetch(`${API_BASE}/api/Aluno`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aluno)
    });

    if (!resposta.ok) {
      const txt = await resposta.text();
      throw new Error(`Erro servidor: ${resposta.status} ${txt}`);
    }

    const dados = await resposta.json();
    alert(dados.mensagem || 'Aluno cadastrado com sucesso.');

    // limpar formulário e voltar para lista
    document.getElementById('f-nome').value = '';
    document.getElementById('f-cpf').value = '';
    document.getElementById('f-email').value = '';
    document.getElementById('f-tel').value = '';
    document.getElementById('f-obs').value = '';

    go('alunos', null);
    carregarAlunos(); // atualiza tabela após cadastrar
  } catch (erro) {
    console.error(erro);
    alert('Erro ao cadastrar aluno. Veja o console para detalhes.');
  }
}

async function carregarAlunos() {
  try {
    const resposta = await fetch(`${API_BASE}/api/Aluno`);
    if (!resposta.ok) throw new Error('Erro na requisição: ' + resposta.status);
    const alunos = await resposta.json();

    const tabela = document.getElementById('tabela-alunos');
    tabela.innerHTML = '';

    if (!Array.isArray(alunos) || alunos.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.setAttribute('colspan', '7');
      td.style.textAlign = 'center';
      td.style.padding = '20px';
      td.style.color = 'gray';
      td.textContent = 'Nenhum aluno cadastrado.';
      tr.appendChild(td);
      tabela.appendChild(tr);
      return;
    }

    alunos.forEach(aluno => {
      const tr = document.createElement('tr');

      const tdNome = document.createElement('td'); tdNome.textContent = aluno.nome || '';
      const tdCpf = document.createElement('td'); tdCpf.textContent = aluno.cpf || '';
      const tdPlano = document.createElement('td'); tdPlano.textContent = aluno.plano || '';
      const tdEmail = document.createElement('td'); tdEmail.textContent = aluno.email || '';

      const tdSituacao = document.createElement('td');
      const spanBadge = document.createElement('span');
      spanBadge.className = 'badge ' + (aluno.ativo ? 'b-ativo' : 'b-inad');
      spanBadge.textContent = aluno.ativo ? 'Ativo' : 'Inativo';
      tdSituacao.appendChild(spanBadge);

      const tdTel = document.createElement('td'); tdTel.textContent = aluno.telefone || '';

      const tdAcoes = document.createElement('td');
      
      const btnVer = document.createElement('button');
      btnVer.className = 'btn btn-outline';
      btnVer.style.padding = '3px 8px';
      btnVer.style.fontSize = '11px';
      btnVer.style.marginRight = '4px';
      btnVer.type = 'button';
      btnVer.textContent = 'Ver';
      btnVer.addEventListener('click', () => verAluno(aluno.id));
      tdAcoes.appendChild(btnVer);

      const btnEditar = document.createElement('button');
      btnEditar.className = 'btn btn-outline';
      btnEditar.style.padding = '3px 8px';
      btnEditar.style.fontSize = '11px';
      btnEditar.type = 'button';
      btnEditar.textContent = 'Editar';
      btnEditar.addEventListener('click', () => editarStatusAluno(aluno.id, aluno.nome, aluno.ativo));
      tdAcoes.appendChild(btnEditar);

      tr.appendChild(tdNome);
      tr.appendChild(tdCpf);
      tr.appendChild(tdPlano);
      tr.appendChild(tdEmail);
      tr.appendChild(tdSituacao);
      tr.appendChild(tdTel);
      tr.appendChild(tdAcoes);

      tabela.appendChild(tr);
    });
  } catch (erro) {
    console.error(erro);
    alert("Erro ao carregar alunos.");
  }
}

// 🚀 Função corrigida
async function verAluno(id) {
  try {
    const resposta = await fetch(`${API_BASE}/api/Aluno/${id}`);

    if (resposta.status === 404) {
      alert("Aluno não encontrado (ID: " + id + ")");
      return;
    }

    if (!resposta.ok) {
      throw new Error("Erro na requisição: " + resposta.status);
    }

    const aluno = await resposta.json();

    alert(`
      Nome: ${aluno.nome || "N/A"}
      CPF: ${aluno.cpf || "N/A"}
      Email: ${aluno.email || "N/A"}
      Telefone: ${aluno.telefone || "N/A"}
      Plano: ${aluno.plano || "N/A"}
      Instrutor: ${aluno.instrutor || "N/A"}
      Observações: ${aluno.observacoes || "N/A"}
    `);

  } catch (erro) {
    console.error(erro);
    alert("Erro ao carregar detalhes do aluno.");
  }
}

let alunoEmEdicao = null;

function editarStatusAluno(id, nome, ativo) {
  alunoEmEdicao = { id, nome, ativo };
  document.getElementById('edit-nome').value = nome;
  document.getElementById('edit-situacao').value = ativo ? 'true' : 'false';
  document.getElementById('modal-editar').style.display = 'flex';
}

function fecharModalEditar() {
  document.getElementById('modal-editar').style.display = 'none';
  alunoEmEdicao = null;
}

async function salvarEdicaoAluno() {
  if (!alunoEmEdicao) return;

  const novoStatus = document.getElementById('edit-situacao').value === 'true';

  try {
    const resposta = await fetch(`${API_BASE}/api/Aluno/${alunoEmEdicao.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: novoStatus })
    });

    if (!resposta.ok) {
      const txt = await resposta.text();
      throw new Error(`Erro servidor: ${resposta.status} ${txt}`);
    }

    alert('Status do aluno atualizado com sucesso.');
    fecharModalEditar();
    carregarAlunos();
  } catch (erro) {
    console.error(erro);
    alert('Erro ao atualizar status do aluno. Veja o console para detalhes.');
  }
}
