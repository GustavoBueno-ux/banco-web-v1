// ======================= IMPORTS FIREBASE =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ======================= CONFIG FIREBASE =======================
const firebaseConfig = {
  apiKey: "AIzaSyBrxWK9zVDiI6GteZwVx_gZXeQSLr5LN60",
  authDomain: "web-banco-d8fd8.firebaseapp.com",
  databaseURL: "https://web-banco-d8fd8-default-rtdb.firebaseio.com",
  projectId: "web-banco-d8fd8"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ======================= AUXILIARES FIREBASE =======================
export async function salvarUsuarioFirebase(usuario) {
    await set(ref(db, `usuarios/${usuario.id}`), usuario);
}

export async function carregarUsuariosFirebase() {
    const snapshot = await get(ref(db, "usuarios"));
    return snapshot.val() || {};
}

export async function carregarTodosUsuariosFirebase() {
    return await carregarUsuariosFirebase();
}

// ======================= CONTAS =======================
export async function CriarConta(nome, cpf, senha) {
    cpf = cpf.replace(/\D/g, "");
    const usuarios = await carregarUsuariosFirebase();

    // Checa se CPF já existe
    if (Object.values(usuarios).some(u => u.cpf === cpf)) {
        return alert("CPF já existe!");
    }

    // Gera ID incremental
    const ultimoId = Object.values(usuarios).map(u => u.id).sort((a,b)=>b-a)[0] || 0;
    const novoId = ultimoId + 1;

    const usuario = { id: novoId, nome, cpf, senha, saldo: 0, extrato: [] };

    await salvarUsuarioFirebase(usuario);

    // Salva ID logado temporariamente
    sessionStorage.setItem("usuarioLogadoId", novoId);

    window.location.href = "conta.html";
}

export async function Entrar(cpf, senha) {
    cpf = cpf.replace(/\D/g, "");
    const usuarios = await carregarUsuariosFirebase();

    const usuario = Object.values(usuarios).find(u => u.cpf === cpf && u.senha === senha);
    if (!usuario) return alert("CPF ou senha incorretos!");

    // Atualiza o ID logado corretamente
    sessionStorage.setItem("usuarioLogadoId", usuario.id);
    window.location.href = "conta.html";
}


// ======================= SALDO =======================
export async function mostrarSaldo() {
    const usuarios = await carregarUsuariosFirebase();
    const idLogado = sessionStorage.getItem("usuarioLogadoId");
    const usuario = Object.values(usuarios).find(u => u.id == idLogado);
    if (!usuario) return alert("Usuário não encontrado!");
    document.getElementById("saldo").innerText = Number(usuario.saldo).toFixed(2);
}

// ======================= DEPÓSITO =======================
export async function Depositar() {
    const valor = parseFloat(document.getElementById("valorDeposito").value);
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido");

    const usuarios = await carregarUsuariosFirebase();
    const idLogado = sessionStorage.getItem("usuarioLogadoId");
    const usuario = Object.values(usuarios).find(u => u.id == idLogado);

    usuario.saldo += valor;
    if (!usuario.extrato) usuario.extrato = [];
    usuario.extrato.push({ tipo: "Depósito", valor, data: new Date().toLocaleString() });

    await salvarUsuarioFirebase(usuario);
    mostrarSaldo();
    window.location.href = "conta.html";
}

// ======================= SAQUE =======================
export async function Sacar() {
    const valor = parseFloat(document.getElementById("valorSaque").value);
    const usuarios = await carregarUsuariosFirebase();
    const idLogado = sessionStorage.getItem("usuarioLogadoId");
    const usuario = Object.values(usuarios).find(u => u.id == idLogado);

    if (isNaN(valor) || valor <= 0 || valor > usuario.saldo) return alert("Saldo insuficiente");

    usuario.saldo -= valor;
    if (!usuario.extrato) usuario.extrato = [];
    usuario.extrato.push({ tipo: "Saque", valor, data: new Date().toLocaleString() });

    await salvarUsuarioFirebase(usuario);
    mostrarSaldo();
    window.location.href = "conta.html";
}

// ======================= EXTRATO =======================
export async function mostrarExtrato() {
    const usuarios = await carregarUsuariosFirebase();
    const idLogado = sessionStorage.getItem("usuarioLogadoId");
    const usuario = Object.values(usuarios).find(u => u.id == idLogado);

    const divExtrato = document.getElementById("listaExtrato");
    if (!divExtrato) return;

    divExtrato.innerHTML = "";

    if (!usuario || !usuario.extrato || usuario.extrato.length === 0) {
        divExtrato.innerHTML = "<p>Nenhuma operação realizada.</p>";
        return;
    }

    usuario.extrato.slice().reverse().forEach(op => {
        const div = document.createElement("div");
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

// ======================= TRANSFERÊNCIAS =======================
export async function ConfirmarCpf(cpfDestino) {
    const idLogado = sessionStorage.getItem("usuarioLogadoId");
    const usuarios = await carregarUsuariosFirebase();

    const destino = Object.values(usuarios).find(u => u.cpf === cpfDestino);
    if (!destino) {
        alert("CPF destino não existe!");
        return false;
    }
    if (destino.id == idLogado) {
        alert("Não pode transferir para você mesmo!");
        return false;
    }

    sessionStorage.setItem("cpfDestino", cpfDestino);
    return true;
}

export async function Transferir() {
    const valor = parseFloat(document.getElementById("valorTransferencia").value);
    const idLogado = sessionStorage.getItem("usuarioLogadoId");
    const cpfDestino = sessionStorage.getItem("cpfDestino");

    if (!cpfDestino) return alert("Nenhum destinatário definido");
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido");

    const usuarios = await carregarUsuariosFirebase();
    const uOrig = Object.values(usuarios).find(u => u.id == idLogado);
    const uDest = Object.values(usuarios).find(u => u.cpf === cpfDestino);

    if (!uOrig || !uDest) return alert("Usuário não encontrado");
    if (valor > uOrig.saldo) return alert("Saldo insuficiente");

    uOrig.saldo -= valor;
    uDest.saldo += valor;

    if (!uOrig.extrato) uOrig.extrato = [];
    if (!uDest.extrato) uDest.extrato = [];

    uOrig.extrato.push({ tipo: "Transferência Enviada", valor, data: new Date().toLocaleString() });
    uDest.extrato.push({ tipo: "Transferência Recebida", valor, data: new Date().toLocaleString() });

    await salvarUsuarioFirebase(uOrig);
    await salvarUsuarioFirebase(uDest);

    mostrarSaldo();
    window.location.href = "conta.html";
}

