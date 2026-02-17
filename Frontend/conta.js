function mostrarSaldo() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let cpfLogado = localStorage.getItem("usuarioLogado");

    let usuario = usuarios.find(u => u.cpf === cpfLogado);

    if (!usuario) {
        alert("Usuário não encontrado!");
        return;
    }

    document.getElementById("saldo").innerText = Number(usuario.saldo).toFixed(2);
}

mostrarSaldo();

