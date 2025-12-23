import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://pdajixsoowcyhnjwhgpc.supabase.co",
  "sb_publishable_LatlFlcxk6IchHe3RNmfwA_9Oq4EsZw"
);

/* ===== ELEMENTOS ===== */
const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");
const adminNome = document.getElementById("adminNome");
const loginMsg = document.getElementById("loginMsg");

const form = document.getElementById("formProduto");
const listaProdutos = document.getElementById("listaProdutos");
const listaPedidos = document.getElementById("listaPedidos");
const categoriaSelect = document.getElementById("categoriaSelect");
const novaCategoria = document.getElementById("novaCategoria");
const msg = document.getElementById("msg");
const busca = document.getElementById("busca");

let produtos = [];
let editandoId = null;

/* ===== LOGIN ===== */
window.login = async ()=>{
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("usuario", loginUser.value)
    .eq("senha", loginPass.value)
    .eq("ativo", true)
    .single();

  if(error){
    loginMsg.textContent = "Login inválido";
    return;
  }

  localStorage.setItem("admin", JSON.stringify(data));
  iniciar();
};

window.logout = ()=>{
  localStorage.clear();
  location.reload();
};

function iniciar(){
  const admin = JSON.parse(localStorage.getItem("admin"));
  if(admin){
    loginBox.style.display="none";
    adminBox.style.display="block";
    adminNome.textContent = admin.usuario;
    carregarProdutos();
    carregarPedidos();
  }
}

/* ===== PRODUTOS ===== */
async function carregarProdutos(){
  const { data } = await supabase.from("produtos").select("*").order("created_at",{ascending:false});
  produtos = data || [];
  listaProdutos.innerHTML = "";

  montarCategorias(produtos);

  produtos.forEach(p=>{
    listaProdutos.innerHTML += `
      <div class="produtoItem">
        <img src="${p.imagem}">
        <div class="produtoInfo">
          <strong>${p.nome}</strong><br>
          R$ ${Number(p.preco).toFixed(2)} - ${p.categoria}
        </div>
        <button onclick="editarProduto('${p.id}')">✏️</button>
        <button onclick="excluirProduto('${p.id}')">🗑️</button>
      </div>
    `;
  });
}

function montarCategorias(lista){
  categoriaSelect.innerHTML = `<option value="">Selecione</option>`;
  [...new Set(lista.map(p=>p.categoria))].forEach(c=>{
    categoriaSelect.innerHTML += `<option>${c}</option>`;
  });
}

window.editarProduto = id=>{
  const p = produtos.find(x=>x.id===id);
  nome.value = p.nome;
  preco.value = p.preco;
  categoriaSelect.value = p.categoria;
  imagemURL.value = p.imagem;
  editandoId = id;
};

/* ===== SALVAR ===== */
form.addEventListener("submit", async e=>{
  e.preventDefault();

  const categoria = novaCategoria.value || categoriaSelect.value;
  const file = imagemFile.files[0];

  if(file){
    const r = new FileReader();
    r.onload = e=> salvar(e.target.result, categoria);
    r.readAsDataURL(file);
  }else{
    salvar(imagemURL.value, categoria);
  }
});

async function salvar(imagem, categoria){
  const dados = {
    nome: nome.value,
    preco: preco.value,
    categoria,
    imagem
  };

  if(editandoId){
    await supabase.from("produtos").update(dados).eq("id",editandoId);
    editandoId = null;
  }else{
    await supabase.from("produtos").insert([dados]);
  }

  form.reset();
  carregarProdutos();
  msg.textContent="Produto salvo!";
  setTimeout(()=>msg.textContent="",3000);
}

window.excluirProduto = async id=>{
  if(confirm("Excluir produto?")){
    await supabase.from("produtos").delete().eq("id",id);
    carregarProdutos();
  }
};

/* ===== BUSCA ===== */
window.filtrarLista = ()=>{
  const t = busca.value.toLowerCase();
  [...listaProdutos.children].forEach(d=>{
    d.style.display = d.innerText.toLowerCase().includes(t) ? "" : "none";
  });
};

/* ===== PEDIDOS ===== */
async function carregarPedidos(){
  const { data } = await supabase.from("pedidos").select("*").order("created_at",{ascending:false});
  listaPedidos.innerHTML="";

  (data||[]).forEach(p=>{
    listaPedidos.innerHTML += `
      <div class="produtoItem">
        <div class="produtoInfo">
          <strong>${p.cliente_nome}</strong><br>
          R$ ${Number(p.total).toFixed(2)}<br>
          ${p.pago ? "✅ Pago" : "⏳ Pendente"}
        </div>
        ${!p.pago ? `<button onclick="marcarPago('${p.id}')">Pagar</button>`:""}
        <button onclick="window.print()">🖨️</button>
      </div>
    `;
  });
}

window.marcarPago = async id=>{
  await supabase.from("pedidos").update({pago:true}).eq("id",id);
  carregarPedidos();
};

iniciar();
