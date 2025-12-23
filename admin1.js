import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://pdajixsoowcyhnjwhgpc.supabase.co",
  "sb_publishable_LatlFlcxk6IchHe3RNmfwA_9Oq4EsZw"
);

const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");
const loginMsg = document.getElementById("loginMsg");
const adminNome = document.getElementById("adminNome");

const form = document.getElementById("formProduto");
const lista = document.getElementById("listaProdutos");
const msg = document.getElementById("msg");
const busca = document.getElementById("busca");

/* 🧾 LOG */
async function registrarLog(acao, detalhes=""){
  const usuario = localStorage.getItem("adminUser") || "desconhecido";
  await supabase.from("logs").insert([{ usuario, acao, detalhes }]);
}

/* 🔐 LOGIN */
window.login = async function(){
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();

  const { data, error } = await supabase
    .from("admins")
    .select("usuario, permissao")
    .eq("usuario", u)
    .eq("senha", p)
    .eq("ativo", true)
    .single();

  if(error){
    loginMsg.textContent = "Usuário ou senha inválidos";
    return;
  }

  localStorage.setItem("adminLogado","true");
  localStorage.setItem("adminUser",data.usuario);
  localStorage.setItem("adminPermissao",data.permissao);

  await registrarLog("login","Admin entrou no sistema");
  iniciar();
};

window.logout = async function(){
  await registrarLog("logout","Admin saiu do sistema");
  localStorage.clear();
  location.reload();
};

function iniciar(){
  const logado = localStorage.getItem("adminLogado");
  if(logado){
    loginBox.style.display="none";
    adminBox.style.display="block";
    adminNome.textContent = localStorage.getItem("adminUser");
    carregarProdutos();
    aplicarPermissoes();
  }else{
    loginBox.style.display="block";
    adminBox.style.display="none";
  }
}

/* 📦 PRODUTOS */
async function carregarProdutos(){
  const { data } = await supabase
    .from("produtos")
    .select("*")
    .order("created_at",{ascending:false});

  lista.innerHTML="";
  data.forEach(p=>{
    lista.innerHTML += `
      <div class="produtoItem">
        <img src="${p.imagem}">
        <div class="produtoInfo">
          <strong>${p.nome}</strong><br>
          R$ ${Number(p.preco).toFixed(2)} - ${p.categoria}
        </div>
        <button class="excluirBtn" onclick="excluirProduto('${p.id}')">Excluir</button>
      </div>
    `;
  });
}

/* ➕ ADICIONAR PRODUTO */
form.addEventListener("submit",e=>{
  e.preventDefault();

  const file = imagemFile.files[0];
  const url = imagemURL.value.trim();

  if(file){
    const r = new FileReader();
    r.onload = e=> salvarProduto(e.target.result);
    r.readAsDataURL(file);
  }else if(url){
    salvarProduto(url);
  }else{
    alert("Escolha uma imagem");
  }
});

async function salvarProduto(imagem){
  await supabase.from("produtos").insert([{
    nome: nome.value,
    preco: preco.value,
    categoria: categoria.value,
    imagem
  }]);

  await registrarLog("criar_produto", `Produto: ${nome.value}`);
  form.reset();
  msg.textContent="Produto adicionado!";
  carregarProdutos();
  setTimeout(()=>msg.textContent="",3000);
}

/* 🗑️ EXCLUIR */
window.excluirProduto = async function(id){
  if(!confirm("Excluir produto?")) return;
  await supabase.from("produtos").delete().eq("id",id);
  await registrarLog("excluir_produto", `ID: ${id}`);
  carregarProdutos();
};

/* 👤 CRIAR ADMIN */
window.criarAdmin = async function(){
  const usuario = novoUsuario.value.trim();
  const senha = novaSenha.value.trim();
  const permissao = novaPermissao.value;

  if(!usuario || !senha){
    alert("Preencha usuário e senha");
    return;
  }

  const { error } = await supabase.from("admins").insert([{
    usuario, senha, permissao, ativo:true
  }]);

  if(error){
    alert("Erro ao criar admin");
    return;
  }

  await registrarLog("criar_admin", `Usuario: ${usuario} | Permissão: ${permissao}`);
  novoUsuario.value="";
  novaSenha.value="";
  adminMsg.textContent="Admin criado!";
  setTimeout(()=>adminMsg.textContent="",3000);
};

/* 🔍 BUSCA */
window.filtrarLista = function(){
  const t = busca.value.toLowerCase();
  [...lista.children].forEach(div=>{
    div.style.display = div.innerText.toLowerCase().includes(t) ? "" : "none";
  });
};

/* 🔐 PERMISSÕES */
function aplicarPermissoes(){
  const perm = localStorage.getItem("adminPermissao");

  if(perm === "visualizar"){
    form.style.display="none";
    document.getElementById("criarAdminBox").style.display="none";
    document.querySelectorAll(".excluirBtn").forEach(b=>b.style.display="none");
  }

  if(perm === "editar"){
    document.getElementById("criarAdminBox").style.display="block";
  }
}

iniciar();
