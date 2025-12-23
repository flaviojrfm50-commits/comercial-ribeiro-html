import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://pdajixsoowcyhnjwhgpc.supabase.co",
  "sb_publishable_LatlFlcxk6IchHe3RNmfwA_9Oq4EsZw"
);

/* ================= CONFIG ================= */
const numeroWhatsApp = "558981089318"; // SOMENTE NÚMEROS

/* ================= ESTADO ================= */
let produtos = [];
let carrinho = [];

/* ================= RESTAURAR CARRINHO ================= */
const carrinhoSalvo = localStorage.getItem("carrinho");
if (carrinhoSalvo) {
  carrinho = JSON.parse(carrinhoSalvo);
}

/* ================= CARREGAR PRODUTOS ================= */
async function carregarProdutos(){
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("categoria");

  if(error){
    console.error("Erro Supabase:", error);
    return;
  }

  produtos = data || [];
  mostrarProdutos(produtos);
  montarCategorias(produtos);

  if (carrinho.length > 0) {
    atualizarCarrinho();
  }
}

carregarProdutos();

/* ================= MOSTRAR PRODUTOS ================= */
function mostrarProdutos(lista){
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  if(lista.length === 0){
    catalogo.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  lista.forEach(p=>{
    catalogo.innerHTML += `
      <div class="produto">
        <img src="${p.imagem}">
        <div class="produto-info">
          <h3>${p.nome}</h3>
          <p>R$ ${Number(p.preco).toFixed(2)}</p>
        </div>
        <button onclick="adicionarCarrinho('${p.id}')">Adicionar</button>
      </div>
    `;
  });
}

/* ================= CATEGORIAS ================= */
function montarCategorias(lista){
  const box = document.getElementById("categorias");
  box.innerHTML = "";

  const categorias = [...new Set(lista.map(p => p.categoria))];

  const btnTodos = document.createElement("button");
  btnTodos.textContent = "Todos";
  estiloCategoria(btnTodos, true);
  btnTodos.onclick = () => mostrarProdutos(produtos);
  box.appendChild(btnTodos);

  categorias.forEach(cat=>{
    const btn = document.createElement("button");
    btn.textContent = cat;
    estiloCategoria(btn);
    btn.onclick = () => {
      mostrarProdutos(produtos.filter(p => p.categoria === cat));
    };
    box.appendChild(btn);
  });
}

function estiloCategoria(btn, ativo=false){
  btn.style.padding = "6px 14px";
  btn.style.borderRadius = "20px";
  btn.style.border = "1px solid #ccc";
  btn.style.cursor = "pointer";
  btn.style.background = ativo ? "#1b8f3a" : "#f4f6f4";
  btn.style.color = ativo ? "#fff" : "#000";
}

/* ================= BUSCA ================= */
window.filtrarProdutos = function(){
  const texto = document.getElementById("pesquisa").value.toLowerCase();
  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto)
  );
  mostrarProdutos(filtrados);
};

/* ================= CARRINHO ================= */
window.adicionarCarrinho = function(id){
  const prod = produtos.find(p => p.id === id);
  if(!prod) return;

  const item = carrinho.find(i => i.id === id);
  if(item){
    item.qtd++;
  }else{
    carrinho.push({...prod, qtd:1});
  }

  atualizarCarrinho();
};

function atualizarCarrinho(){
  const box = document.getElementById("carrinho-container");
  const itens = document.getElementById("carrinho-itens");
  const totalSpan = document.getElementById("total");

  if(carrinho.length === 0){
    box.style.display = "none";
    localStorage.removeItem("carrinho");
    return;
  }

  box.style.display = "block";
  itens.innerHTML = "";
  let total = 0;

  carrinho.forEach((i, idx)=>{
    total += i.preco * i.qtd;
    itens.innerHTML += `
      <div class="carrinho-item">
        <span>${i.nome} x${i.qtd}</span>
        <button onclick="removerItem(${idx})">❌</button>
      </div>
    `;
  });

  totalSpan.textContent = total.toFixed(2);

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

window.removerItem = function(i){
  carrinho.splice(i,1);
  atualizarCarrinho();
};

/* ================= FINALIZAR COMPRA ================= */
document.getElementById("btnFinalizar").onclick = () => {
  if (carrinho.length === 0) {
    alert("Carrinho vazio");
    return;
  }

  const nome = document.getElementById("clienteNome").value.trim();
  const endereco = document.getElementById("clienteEndereco").value.trim();

  if (!nome) {
    alert("Informe seu nome");
    return;
  }

  let mensagem = `🛒 *Novo Pedido*\n\n👤 Cliente: ${nome}\n`;
  if (endereco) mensagem += `📍 Endereço: ${endereco}\n\n`;

  let total = 0;
  carrinho.forEach(i => {
    mensagem += `• ${i.nome} x${i.qtd} – R$ ${(i.preco * i.qtd).toFixed(2)}\n`;
    total += i.preco * i.qtd;
  });

  mensagem += `\n💰 *Total:* R$ ${total.toFixed(2)}`;

  const link = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");

  // limpar carrinho após finalizar
  carrinho = [];
  localStorage.removeItem("carrinho");
  atualizarCarrinho();
};
