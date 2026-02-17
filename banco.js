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

// ======================= FUNÇÕES AUXILIARES =======================
async function carregarTransferencias() {
    const snapshot = await get(ref(db, "transferencias"));
    return snapshot.val() || {};
}

async function salvarTransferencias(transferencias) {
    await set(ref(db, "transferencias"), transferencias);
}

// ======================= TRANSFERIR =======================
export async function Transferir() {
    const valor = parseFloat(document.getElementById("valorTransferencia").value);
    const cpfLogado = localStorage.getItem("usuarioLogado");
    const cpfDestino = document.getElementById("cpfDestino").value.trim();

    if (cpfLogado === cpfDestino) return alert("Não pode transferir para você mesmo!");
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido");

    // pega a lista de transferências mais recente
    let transferencias = await carregarTransferencias();

    // cria registro se não existir
    if (!transferencias[cpfLogado]) transferencias[cpfLogado] = [];
    if (!transferencias[cpfDestino]) transferencias[cpfDestino] = [];

    // pega usuários locais (localStorage)
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    let destino = usuarios.find(u => u.cpf === cpfDestino);

    if (!usuario || !destino) return alert("CPF destino não encontrado no seu sistema local");

    if (valor > usuario.saldo) return alert("Saldo insuficiente!");

    // atualiza saldos localmente
    usuario.saldo -= valor;
    destino.saldo += valor;

    // salva localmente
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // registra transferência no Firebase
    const data = new Date().toLocaleString();
    transferencias[cpfLogado].push({ tipo: "Enviado", valor, para: cpfDestino, data });
    transferencias[cpfDestino].push({ tipo: "Recebido", valor, de: cpfLogado, data });

    await salvarTransferencias(transferencias);

    alert("Transferência realizada com sucesso!");
    mostrarSaldo(); // sua função local pra atualizar saldo na tela
}

