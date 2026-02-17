// ======================= IMPORTS FIREBASE =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ======================= CONFIGURAÇÃO DO FIREBASE =======================
const firebaseConfig = {
  apiKey: "AIzaSyBrxWK9zVDiI6GteZwVx_gZXeQSLr5LN60",
  authDomain: "web-banco-d8fd8.firebaseapp.com",
  databaseURL: "https://web-banco-d8fd8-default-rtdb.firebaseio.com",
  projectId: "web-banco-d8fd8"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ======================= FUNÇÕES AUXILIARES =======================
async function carregarUsuarios() {
    const snapshot = await get(ref(db, "usuarios"));
    return snapshot.val() || {};
}

async function salvarUsuarios(usuarios) {
    await set(ref(db, "usuarios"), usuarios);
}

// ======================= CRIAR CONTA =======================
export async function Criar() {
    const nome = document.getElementById("nome").value.trim();
    let cpf = document.getElementById("cpf").value.trim();
    const senha = document.getElementById("senha").value;

    if (!nome || !cpf || !senha) return alert("Preencha todos os campos!");
    cpf = cpf.replace(/\D/g, "");
    if (senha.length < 4) return alert("Senha deve ter no mínimo 4 caracteres!");

    let usuarios = await carregarUsuarios();
    if (usuarios[cpf]) return alert("Já existe uma conta com esse CPF!");

    usuarios[cpf] = { nome, cpf, senha, saldo: 0, extrato: [] };
    await salvarUsuarios(usuarios);

    localStorage.setItem("usuarioLogado", cpf);
    window.location.href = "conta.html";
}

// ======================= ENTRAR =======================
export async function Entrar() {
    let cpf = document.getElementById("cpf").value.trim();
    const senha = document.getElementById("senha").value.trim();
    cpf = cpf.replace(/\D/g, "");

    let usuarios = await carregarUsuarios();
    const usuario = usuarios[cpf];
    if (usuario && usuario.senha === senha) {
        localStorage.setItem("usuarioLogado", cpf);
        window.location.href = "conta.html";
    } else {
        alert("CPF ou senha incorretos!");
    }
}

// ======================= MOSTRAR SALDO =======================
export async function mostrarSaldo() {
    const cpfLogado = localStorage.getItem("usuarioLogado");
    const usuarios = await carregarUsuarios();
    const usuario = usuarios[cpfLogado];
    if (!usuario) return alert("Usuário não encontrado!");
    document.getElementById("saldo").innerText = Number(usuario.saldo).toFixed(2);
}

// ======================= DEPOSITAR =======================
export async function Depositar() {
    let valor = parseFloat(document.getElementById("valorDeposito").value);
    if (isNaN(valor) || valor <= 0) return alert("Digite um valor válido!");

    const cpfLogado = localStorage.getItem("usuarioLogado");
    let usuarios = await carregarUsuarios();
    let usuario = usuarios[cpfLogado];

    usuario.saldo = Number(usuario.saldo) + valor;
    usuario.extrato = usuario.extrato || [];
    usuario.extrato.push({ tipo: "Depósito", valor, data: new Date().toLocaleString() });

    usuarios[cpfLogado] = usuario;
    await salvarUsuarios(usuarios);

    mostrarSaldo();
    window.location.href = "conta.html";
}

// ======================= SACAR =======================
export async function Sacar() {
    let valor = parseFloat(document.getElementById("valorSaque").value);
    const cpfLogado = localStorage.getItem("usuarioLogado");
    let usuarios = await carregarUsuarios();
    let usuario = usuarios[cpfLogado];

    if (isNaN(valor) || valor <= 0 || valor > usuario.saldo) return alert("Valor inválido ou saldo insuficiente!");

    usuario.saldo -= valor;
    usuario.extrato = usuario.extrato || [];
    usuario.extrato.push({ tipo: "Saque", valor, data: new Date().toLocaleString() });

    usuarios[cpfLogado] = usuario;
    await salvarUsuarios(usuarios);

    mostrarSaldo();
    window.location.href = "conta.html";
}

// ======================= CONFIRMAR CPF DESTINO =======================
export async function ConfirmarCpf() {
    const cpfDestino = document.getElementById("cpfDestino").value.trim();
    const cpfLogado = localStorage.getItem("usuarioLogado");
    let usuarios = await carregarUsuarios();

    if (!usuarios[cpfDestino]) return alert("CPF não encontrado!");
    if (cpfDestino === cpfLogado) return alert("Não pode transferir para você mesmo!");

    localStorage.setItem("cpfDestino", cpfDestino);
    window.location.href = "transferencia.html";
}

// ======================= CARREGAR DESTINO =======================
export async function carregarDestino() {
    if (!document.getElementById("nomeDestino")) return;

    const cpfDestino = localStorage.getItem("cpfDestino");
    let usuarios = await carregarUsuarios();
    const usuarioDestino = usuarios[cpfDestino];

    if (usuarioDestino) document.getElementById("nomeDestino").innerText = usuarioDestino.nome;
}

// ======================= TRANSFERIR =======================
export async function Transferir() {
    const valor = parseFloat(document.getElementById("valorTransferencia").value);
    const cpfLogado = localStorage.getItem("usuarioLogado");
    const cpfDestino = localStorage.getItem("cpfDestino");

    let usuarios = await carregarUsuarios();
    let usuario = usuarios[cpfLogado];
    let destino = usuarios[cpfDestino];

    if (!usuario || !destino) return alert("Erro nos usuários!");
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido");
    if (valor > usuario.saldo) return alert("Saldo insuficiente!");

    usuario.saldo -= valor;
    destino.saldo += valor;

    usuario.extrato = usuario.extrato || [];
    destino.extrato = destino.extrato || [];

    usuario.extrato.push({ tipo: "Transferência Enviada", valor, data: new Date().toLocaleString() });
    destino.extrato.push({ tipo: "Transferência Recebida", valor, data: new Date().toLocaleString() });

    usuarios[cpfLogado] = usuario;
    usuarios[cpfDestino] = destino;
    await salvarUsuarios(usuarios);

    mostrarSaldo();
    window.location.href = "conta.html";
}

// ======================= MOSTRAR EXTRATO =======================
export async function mostrarExtrato() {
    const cpfLogado = localStorage.getItem("usuarioLogado");
    const usuarios = await carregarUsuarios();
    const usuario = usuarios[cpfLogado];

    const divExtrato = document.getElementById("listaExtrato");
    if (!divExtrato) return;

    divExtrato.innerHTML = "";
    if (!usuario || !usuario.extrato || usuario.extrato.length === 0) {
        divExtrato.innerHTML = "<p>Nenhuma operação realizada.</p>";
        return;
    }

    usuario.extrato.slice().reverse().forEach(op => {
        let div = document.createElement("div");
        div.classList.add("extrato-item");

        if (op.tipo.includes("Depósito")) div.classList.add("deposito");
        if (op.tipo.includes("Saque")) div.classList.add("saque");
        if (op.tipo.includes("Transferência")) div.classList.add("transferencia");

        div.innerHTML = `
            <div class="extrato-tipo">${op.tipo}</div>
            <div class="extrato-valor">R$ ${op.valor.toFixed(2)}</div>
            <div class="extrato-data">${op.data}</div>
        `;
        divExtrato.appendChild(div);
    });
}
