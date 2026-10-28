"use strict";

// Preços em centavos para evitar problemas nos cálculos.
const produtos = [
  {
    id: 1,
    nome: "Teclado mecânico",
    categoria: "Periféricos",
    descricao: "Mais conforto para estudar, trabalhar e jogar.",
    preco: 19990,
    icone: "⌨️"
  },
  {
    id: 2,
    nome: "Mouse sem fio",
    categoria: "Periféricos",
    descricao: "Precisão e liberdade para sua rotina.",
    preco: 8990,
    icone: "🖱️"
  },
  {
    id: 3,
    nome: "Headset",
    categoria: "Áudio",
    descricao: "Som e microfone para chamadas e partidas.",
    preco: 14990,
    icone: "🎧"
  },
  {
    id: 4,
    nome: "Monitor de 24 polegadas",
    categoria: "Monitores",
    descricao: "Mais espaço para suas tarefas e entretenimento.",
    preco: 79990,
    icone: "🖥️"
  },
  {
    id: 5,
    nome: "Webcam",
    categoria: "Acessórios",
    descricao: "Praticidade para aulas e reuniões on-line.",
    preco: 12990,
    icone: "📷"
  },
  {
    id: 6,
    nome: "Controle USB",
    categoria: "Games",
    descricao: "Um novo jeito de aproveitar seus jogos.",
    preco: 11990,
    icone: "🎮"
  }
];

let carrinho = [];
let temporizadorMensagem;

const listaProdutos = document.querySelector("#lista-produtos");
const itensCarrinho = document.querySelector("#itens-carrinho");
const contadorCarrinho = document.querySelector("#contador-carrinho");
const totalCarrinho = document.querySelector("#total-carrinho");
const mensagemVazio = document.querySelector("#mensagem-vazio");
const mensagemStatus = document.querySelector("#mensagem-status");
const botaoFinalizar = document.querySelector("#finalizar-compra");
const botaoLimpar = document.querySelector("#limpar-carrinho");

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function formatarMoeda(centavos) {
  return moeda.format(centavos / 100);
}

function mostrarMensagem(texto, erro = false) {
  clearTimeout(temporizadorMensagem);

  mensagemStatus.textContent = texto;
  mensagemStatus.classList.toggle("erro", erro);

  temporizadorMensagem = setTimeout(() => {
    mensagemStatus.textContent = "";
    mensagemStatus.classList.remove("erro");
  }, 5000);
}

// Monta os cards usando somente os dados fixos do catálogo.
function renderizarProdutos() {
  listaProdutos.innerHTML = produtos.map((produto) => `
    <article class="produto">
      <div class="produto-imagem" aria-hidden="true">
        ${produto.icone}
      </div>

      <div class="produto-info">
        <span class="produto-categoria">${produto.categoria}</span>
        <h3>${produto.nome}</h3>
        <p class="produto-descricao">${produto.descricao}</p>
        <p class="produto-preco">${formatarMoeda(produto.preco)}</p>

        <button
          class="botao botao-primario"
          type="button"
          data-adicionar="${produto.id}"
          aria-label="Adicionar ${produto.nome} ao carrinho"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  `).join("");
}

function calcularTotal() {
  return carrinho.reduce((total, item) => {
    return total + item.preco * item.quantidade;
  }, 0);
}

function quantidadeValida(quantidade) {
  return Number.isSafeInteger(quantidade) && quantidade > 0;
}

// Confere se o novo total continua dentro da precisão dos inteiros.
function totalValidoComQuantidade(id, preco, quantidade) {
  const subtotal = preco * quantidade;

  if (!Number.isSafeInteger(subtotal)) {
    return false;
  }

  const totalOutrosItens = carrinho.reduce((total, item) => {
    return item.id === id
      ? total
      : total + item.preco * item.quantidade;
  }, 0);

  return Number.isSafeInteger(totalOutrosItens + subtotal);
}

function adicionarProduto(id) {
  const produto = produtos.find((produto) => produto.id === id);

  if (!produto) {
    mostrarMensagem("Produto não encontrado.", true);
    return;
  }

  const itemExistente = carrinho.find((item) => item.id === id);
  const novaQuantidade = itemExistente
    ? itemExistente.quantidade + 1
    : 1;

  if (
    !quantidadeValida(novaQuantidade) ||
    !totalValidoComQuantidade(id, produto.preco, novaQuantidade)
  ) {
    mostrarMensagem("Quantidade acima do limite de cálculo.", true);
    return;
  }

  if (itemExistente) {
    itemExistente.quantidade = novaQuantidade;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1
    });
  }

  renderizarCarrinho();
  mostrarMensagem(`${produto.nome} adicionado ao carrinho.`);
}

function removerProduto(id) {
  const indice = carrinho.findIndex((item) => item.id === id);

  if (indice === -1) {
    return;
  }

  const nome = carrinho[indice].nome;

  carrinho.splice(indice, 1);
  renderizarCarrinho();

  // Mantém a navegação por teclado após remover o botão selecionado.
  const botoesRemover = itensCarrinho.querySelectorAll("[data-remover]");
  const proximoBotao = botoesRemover[indice] || botoesRemover[indice - 1];

  if (proximoBotao) {
    proximoBotao.focus();
  } else {
    listaProdutos.querySelector("[data-adicionar]")?.focus();
  }

  mostrarMensagem(`${nome} removido do carrinho.`);
}

function atualizarQuantidade(id, quantidade) {
  const item = carrinho.find((item) => item.id === id);

  if (!item) {
    return false;
  }

  if (!quantidadeValida(quantidade)) {
    mostrarMensagem("Informe uma quantidade inteira maior que zero.", true);
    return false;
  }

  if (!totalValidoComQuantidade(id, item.preco, quantidade)) {
    mostrarMensagem("Quantidade acima do limite de cálculo.", true);
    return false;
  }

  item.quantidade = quantidade;

  // Atualiza os valores sem recriar o campo que está sendo editado.
  const subtotal = document.querySelector(`#subtotal-${id}`);
  subtotal.textContent = formatarMoeda(item.preco * quantidade);

  atualizarResumo();
  mostrarMensagem("Quantidade atualizada.");
  return true;
}

function atualizarResumo() {
  const quantidadeTotal = carrinho.reduce((total, item) => {
    return total + item.quantidade;
  }, 0);

  const vazio = carrinho.length === 0;

  contadorCarrinho.textContent = quantidadeTotal;
  totalCarrinho.textContent = formatarMoeda(calcularTotal());
  mensagemVazio.hidden = !vazio;
  botaoFinalizar.disabled = vazio;
  botaoLimpar.disabled = vazio;
}

function renderizarCarrinho() {
  itensCarrinho.innerHTML = carrinho.map((item) => `
    <li class="item-carrinho">
      <div class="item-cabecalho">
        <div>
          <h3 class="item-nome">${item.nome}</h3>
          <p class="item-preco">
            ${formatarMoeda(item.preco)} por unidade
          </p>
        </div>

        <button
          class="botao-remover"
          type="button"
          data-remover="${item.id}"
          aria-label="Remover ${item.nome} do carrinho"
        >
          Remover
        </button>
      </div>

      <div class="item-controles">
        <div class="quantidade-grupo">
          <label for="quantidade-${item.id}">Qtd.</label>

          <input
            class="quantidade-input"
            id="quantidade-${item.id}"
            type="number"
            min="1"
            step="1"
            required
            value="${item.quantidade}"
            data-quantidade="${item.id}"
            aria-label="Quantidade de ${item.nome}"
          >
        </div>

        <strong
          class="item-subtotal"
          id="subtotal-${item.id}"
        >
          ${formatarMoeda(item.preco * item.quantidade)}
        </strong>
      </div>
    </li>
  `).join("");

  atualizarResumo();
}

function limparCarrinho() {
  if (carrinho.length === 0) {
    return;
  }

  const confirmou = window.confirm("Deseja esvaziar o carrinho?");

  if (!confirmou) {
    return;
  }

  carrinho = [];
  renderizarCarrinho();
  listaProdutos.querySelector("[data-adicionar]")?.focus();

  mostrarMensagem("Carrinho esvaziado.");
}

function finalizarCompra() {
  if (carrinho.length === 0) {
    mostrarMensagem("Adicione um produto antes de finalizar.", true);
    return;
  }

  const resumo = carrinho.map((item) => {
    return `${item.quantidade} × ${item.nome}: ${
      formatarMoeda(item.preco * item.quantidade)
    }`;
  }).join("\n");

  window.alert(
    "RESUMO DA SIMULAÇÃO\n\n" +
    resumo +
    "\n\nTotal: " + formatarMoeda(calcularTotal()) +
    "\n\nNenhum pagamento ou pedido real foi realizado."
  );

  mostrarMensagem("Simulação concluída! Seu carrinho foi mantido.");
}

// Um listener na lista atende aos botões de todos os produtos.
listaProdutos.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-adicionar]");

  if (botao) {
    adicionarProduto(Number(botao.dataset.adicionar));
  }
});

itensCarrinho.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-remover]");

  if (botao) {
    removerProduto(Number(botao.dataset.remover));
  }
});

itensCarrinho.addEventListener("change", (evento) => {
  const campo = evento.target.closest("[data-quantidade]");

  if (!campo) {
    return;
  }

  const id = Number(campo.dataset.quantidade);
  const quantidade = Number(campo.value);
  const atualizou = atualizarQuantidade(id, quantidade);

  if (!atualizou) {
    const item = carrinho.find((item) => item.id === id);

    if (item) {
      campo.value = item.quantidade;
    }
  }
});

botaoLimpar.addEventListener("click", limparCarrinho);
botaoFinalizar.addEventListener("click", finalizarCompra);

renderizarProdutos();
renderizarCarrinho();