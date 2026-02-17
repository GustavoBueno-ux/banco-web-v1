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
async function salvarUsuarioFirebase(usuario) {
    await set(ref(db, `usuarios/${usuario.cpf}`), usuario);
}

async function carregarUsuariosFirebase() {
    const snapshot = await get(ref(db, "usuarios"));
    return snapshot.val() || {};
}

// ======================= LOCAL STORAGE =======================
export function mostrarSaldo() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    if(!usuario) return alert("Usuário não encontrado!");
    document.getElementById("saldo").innerText = Number(usuario.saldo).toFixed(2);
}

export function Depositar() {
    let valor = parseFloat(document.getElementById("valorDeposito").value);
    if(isNaN(valor)||valor<=0) return alert("Valor inválido!");
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u=>u.cpf===cpfLogado);
    usuario.saldo += valor;
    if(!usuario.extrato) usuario.extrato=[];
    usuario.extrato.push({tipo:"Depósito", valor, data:new Date().toLocaleString()});
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    mostrarSaldo();
}

export function Sacar() {
    let valor = parseFloat(document.getElementById("valorSaque").value);
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let usuario = usuarios.find(u=>u.cpf===cpfLogado);
    if(isNaN(valor)||valor<=0||valor>usuario.saldo) return alert("Saldo insuficiente!");
    usuario.saldo -= valor;
    if(!usuario.extrato) usuario.extrato=[];
    usuario.extrato.push({tipo:"Saque", valor, data:new Date().toLocaleString()});
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    mostrarSaldo();
}

// ======================= CRIAR CONTA =======================
export async function CriarConta(nome, cpf, senha) {
    cpf = cpf.replace(/\D/g, "");
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    if(usuarios.some(u=>u.cpf===cpf)) return alert("CPF já existe localmente!");

    let usuario = { nome, cpf, senha, saldo:0, extrato:[] };
    usuarios.push(usuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("usuarioLogado", cpf);

    // salva no Firebase também
    await salvarUsuarioFirebase(usuario);

    alert("Conta criada com sucesso!");
}

// ======================= TRANSFERÊNCIA =======================
export async function ConfirmarCpf() {
    let cpfDestino = document.getElementById("cpfDestino").value.trim();
    let cpfLogado = localStorage.getItem("usuarioLogado");
    if(cpfDestino === cpfLogado) return alert("Não pode transferir para você mesmo!");
    const usuariosFirebase = await carregarUsuariosFirebase();
    if(!usuariosFirebase[cpfDestino]) return alert("CPF destino não existe!");
    localStorage.setItem("cpfDestino", cpfDestino);
    alert("CPF confirmado! Agora insira o valor e clique Transferir.");
}

export async function Transferir() {
    let valor = parseFloat(document.getElementById("valorTransferencia").value);
    let cpfLogado = localStorage.getItem("usuarioLogado");
    let cpfDestino = localStorage.getItem("cpfDestino");
    if(cpfDestino===cpfLogado) return alert("Não pode transferir para você mesmo!");
    if(isNaN(valor)||valor<=0) return alert("Valor inválido");

    // pega usuários locais
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let uOrig = usuarios.find(u=>u.cpf===cpfLogado);
    let uDest = usuarios.find(u=>u.cpf===cpfDestino);
    if(!uOrig || !uDest) return alert("Usuário não encontrado localmente");
    if(valor>uOrig.saldo) return alert("Saldo insuficiente!");

    uOrig.saldo -= valor;
    uDest.saldo += valor;
    if(!uOrig.extrato) uOrig.extrato=[];
    if(!uDest.extrato) uDest.extrato=[];
    uOrig.extrato.push({tipo:"Transferência Enviada", valor, data:new Date().toLocaleString()});
    uDest.extrato.push({tipo:"Transferência Recebida", valor, data:new Date().toLocaleString()});
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // salva no Firebase
    await salvarUsuarioFirebase(uOrig);
    await salvarUsuarioFirebase(uDest);

    alert("Transferência realizada!");
    mostrarSaldo();
}

