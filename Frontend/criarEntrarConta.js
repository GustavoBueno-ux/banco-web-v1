function Criar() {
    const nome = document.getElementById("nome").value.trim();
    let cpf = document.getElementById("cpf").value.trim();
    const senha = document.getElementById("senha").value;

    if (!nome || !cpf || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    cpf = cpf.replace(/\D/g, "");

    if (senha.length < 4) {
        alert("Senha deve ter no mínimo 4 caracteres!");
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    const cpfExiste = usuarios.some(u => u.cpf === cpf);
    if (cpfExiste) {
        alert("Já existe uma conta com esse CPF!");
        return;
    }

    const usuario = {
        nome,
        cpf,
        senha,
        saldo: 0
    };

    usuarios.push(usuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    localStorage.setItem("usuarioLogado", cpf);
    window.location.href = "conta.html";
}

function Entrar() {
    let cpf = document.getElementById("cpf").value.trim();
    const senha = document.getElementById("senha").value.trim();

    cpf = cpf.replace(/\D/g, "");

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    const usuario = usuarios.find(u => u.cpf === cpf && u.senha === senha);

    if (usuario) {
        localStorage.setItem("usuarioLogado", usuario.cpf);
        window.location.href = "conta.html";
    } else {
        alert("CPF ou senha incorretos!");
    }
}
