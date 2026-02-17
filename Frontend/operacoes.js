function mostrarSaldo() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");

    let usuario = usuarios.find(u => u.cpf === cpfLogado);

    if (usuario) {
        document.getElementById("saldo").innerText = Number(usuario.saldo).toFixed(2);
    }
}

function Depositar() {
    let valor = parseFloat(document.getElementById("valorDeposito").value);

    if (isNaN(valor) || valor <= 0) {
        alert("Digite um valor válido!");
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem("usuarios"));
    let cpfLogado = localStorage.getItem("usuarioLogado");

    let usuario = usuarios.find(u => u.cpf === cpfLogado);

    // garante saldo como número
    usuario.saldo = Number(usuario.saldo);
    usuario.saldo += valor;

    // cria extrato se não existir
    if (!usuario.extrato) usuario.extrato = [];

    usuario.extrato.push({
        tipo: "Depósito",
        valor: valor,
        data: new Date().toLocaleString()
    });

    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    //mostrarSaldo();

    if (document.getElementById("saldo")) {
        mostrarSaldo();
    }

    window.location.href = "conta.html";
}

function Sacar() {
    let valor = parseFloat(document.getElementById("valorSaque").value);

    let usuarios = JSON.parse(localStorage.getItem("usuarios"));
    let cpfLogado = localStorage.getItem("usuarioLogado");

    let usuario = usuarios.find(u => u.cpf === cpfLogado);

    if (isNaN(valor) || valor <= 0 || usuario.saldo < valor) {
        alert("Digite um valor válido!");
        return;
    }

    usuario.saldo = Number(usuario.saldo);
    usuario.saldo -= valor;

    if (!usuario.extrato) usuario.extrato = [];

    usuario.extrato.push({
        tipo: "Saque",
        valor: valor,
        data: new Date().toLocaleString()
    });

    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    //mostrarSaldo();

    if (document.getElementById("saldo")) {
        mostrarSaldo();
    }

    window.location.href = "conta.html";
}

function ConfirmarCpf() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let cpfDestino = document.getElementById("cpfDestino").value.trim();
    let cpfLogado = localStorage.getItem("usuarioLogado");

    let usuarioDestino = usuarios.find(u => u.cpf === cpfDestino);

    if (!usuarioDestino) {
        alert("CPF não encontrado!");
        return;
    }

    if (cpfDestino === cpfLogado) {
        alert("Não pode transferir para você mesmo!");
        return;
    }

    // salvar cpf destino
    localStorage.setItem("cpfDestino", cpfDestino);

    // ir para próxima página
    window.location.href = "transferencia.html";
    mostrarSaldo();
}

function carregarDestino() {
    if (!document.getElementById("nomeDestino")) return;

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfDestino = localStorage.getItem("cpfDestino");

    let usuarioDestino = usuarios.find(u => u.cpf === cpfDestino);

    if (usuarioDestino) {
        document.getElementById("nomeDestino").innerText = usuarioDestino.nome;
    }
}

carregarDestino();

function Transferir() {

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let cpfLogado = localStorage.getItem("usuarioLogado");
    let cpfDestino = localStorage.getItem("cpfDestino");

    let valor = parseFloat(document.getElementById("valorTransferencia").value);

    let usuario = usuarios.find(u => u.cpf === cpfLogado);
    let destino = usuarios.find(u => u.cpf === cpfDestino);

    

    if (!usuario || !destino) {
        alert("Erro nos usuários!");
        console.log(usuario, destino);
        return;
    }

    usuario.saldo = Number(usuario.saldo);
    destino.saldo = Number(destino.saldo);


    if (isNaN(valor) || valor <= 0) {
        alert("Valor inválido");
        return;
    }

    if (valor > usuario.saldo) {
        alert("Saldo insuficiente!");
        return;
    }

    usuario.saldo -= valor;
    destino.saldo += valor;


    if (!usuario.extrato) usuario.extrato = [];
    if (!destino.extrato) destino.extrato = [];

    usuario.extrato.push({ tipo: "Transferência Enviada", valor, data: new Date().toLocaleString() });
    destino.extrato.push({ tipo: "Transferência Recebida", valor, data: new Date().toLocaleString() });

    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    if (document.getElementById("saldo")) {
        mostrarSaldo();
    }


    window.location.href = "conta.html";
}

function mostrarExtrato() {

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");

    let usuario = usuarios.find(u => u.cpf === cpfLogado);

    let divExtrato = document.getElementById("listaExtrato");
    if (!divExtrato) return;

    divExtrato.innerHTML = "";

    if (!usuario || !usuario.extrato || usuario.extrato.length === 0) {
        divExtrato.innerHTML = "<p>Nenhuma operação realizada.</p>";
        return;
    }

    // mostrar do mais recente pro mais antigo
    usuario.extrato.slice().reverse().forEach(op => {

        let div = document.createElement("div");
        div.classList.add("extrato-item");

        // tipo visual
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

mostrarExtrato();

mostrarSaldo();
