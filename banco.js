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
async function carregarUsuariosFirebase() {
    const snapshot = await get(ref(db, "usuarios"));
    return snapshot.val() || {};
}

async function salvarUsuarioFirebase(cpf, usuario) {
    await set(ref(db, `usuarios/${cpf}`), usuario);
}

// ======================= LOCAL STORAGE FUNÇÕES =======================

export function mostrarSaldo() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    if (!usuario) return alert("Usuário não encontrado!");
    document.getElementById("saldo").innerText = Number(usuario.saldo).toFixed(2);
}

export function mostrarExtrato() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    let divExtrato = document.getElementById("listaExtrato");
    if(!divExtrato) return;
    divExtrato.innerHTML = "";
    if(!usuario || !usuario.extrato || usuario.extrato.length===0) {
        divExtrato.innerHTML="<p>Nenhuma operação realizada.</p>";
        return;
    }
    usuario.extrato.slice().reverse().forEach(op=>{
        let div=document.createElement("div");
        div.classList.add("extrato-item");
        if(op.tipo.includes("Depósito")) div.classList.add("deposito");
        if(op.tipo.includes("Saque")) div.classList.add("saque");
        if(op.tipo.includes("Transferência")) div.classList.add("transferencia");
        div.innerHTML=`<div class="extrato-tipo">${op.tipo}</div>
                       <div class="extrato-valor">R$ ${op.valor.toFixed(2)}</div>
                       <div class="extrato-data">${op.data}</div>`;
        divExtrato.appendChild(div);
    });
}

export function Depositar() {
    let valor = parseFloat(document.getElementById("valorDeposito").value);
    if(isNaN(valor)||valor<=0) return alert("Digite um valor válido!");
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    usuario.saldo = Number(usuario.saldo) + valor;
    if(!usuario.extrato) usuario.extrato = [];
    usuario.extrato.push({ tipo:"Depósito", valor, data: new Date().toLocaleString() });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    mostrarSaldo();
    mostrarExtrato();
}

export function Sacar() {
    let valor = parseFloat(document.getElementById("valorSaque").value);
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    if(isNaN(valor) || valor<=0 || valor>usuario.saldo) return alert("Valor inválido ou saldo insuficiente!");
    usuario.saldo -= valor;
    if(!usuario.extrato) usuario.extrato=[];
    usuario.extrato.push({ tipo:"Saque", valor, data: new Date().toLocaleString() });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    mostrarSaldo();
    mostrarExtrato();
}

// ======================= TRANSFERÊNCIA FIREBASE =======================

export async function ConfirmarCpf() {
    let cpfDestino = document.getElementById("cpfDestino").value.trim();
    let cpfLogado = localStorage.getItem("usuarioLogado");
    if(cpfLogado === cpfDestino) return alert("Não pode transferir para você mesmo!");
    // verifica no Firebase
    const usuariosFirebase = await carregarUsuariosFirebase();
    if(!usuariosFirebase[cpfDestino]) return alert("CPF não encontrado no sistema global!");
    localStorage.setItem("cpfDestino", cpfDestino);
    alert("CPF confirmado! Agora coloque o valor e clique em Transferir.");
}

export async function Transferir() {
    let valor = parseFloat(document.getElementById("valorTransferencia").value);
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let cpfDestino = localStorage.getItem("cpfDestino");
    if(cpfLogado === cpfDestino) return alert("Não pode transferir para você mesmo!");
    if(isNaN(valor)||valor<=0) return alert("Valor inválido");

    // pega usuários locais
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let usuario = usuarios.find(u=>u.cpf===cpfLogado);
    let destino = usuarios.find(u=>u.cpf===cpfDestino);
    if(!usuario || !destino) return alert("Usuário não encontrado localmente");
    if(valor > usuario.saldo) return alert("Saldo insuficiente!");

    // atualiza saldo local
    usuario.saldo -= valor;
    destino.saldo += valor;
    if(!usuario.extrato) usuario.extrato=[];
    if(!destino.extrato) destino.extrato=[];
    usuario.extrato.push({ tipo:"Transferência Enviada", valor, data: new Date().toLocaleString() });
    destino.extrato.push({ tipo:"Transferência Recebida", valor, data: new Date().toLocaleString() });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // atualiza saldo no Firebase
    await salvarUsuarioFirebase(cpfLogado, usuario);
    await salvarUsuarioFirebase(cpfDestino, destino);

    alert("Transferência realizada com sucesso!");
    mostrarSaldo();
    mostrarExtrato();
}

// ======================= CARREGAR DESTINO =======================
export function carregarDestino() {
    let cpfDestino = localStorage.getItem("cpfDestino");
    if(!cpfDestino) return;
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let destino = usuarios.find(u=>u.cpf===cpfDestino);
    if(destino && document.getElementById("nomeDestino"))
        document.getElementById("nomeDestino").innerText = destino.nome;
}

