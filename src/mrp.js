// --- CLASSES ---
export class ArvoreDeProducao {
  constructor(qtdPeriodos) {
    this.qtdPeriodos = qtdPeriodos;
    this.itens = [];
  }

  adicionarItem(item) {
    // Inicia item com o MRP zerado
    for (let i = 0; i < this.qtdPeriodos; i++) {
      item.necesidadesBrutas.push(0);
      item.recebimentosProgramados.push(0);
      item.estoqueProjetado.push(0);
      item.recebimentoOrdensPlanejadas.push(0);
      item.liberacaoOrdensPlanejadas.push(0);
    }

    this.itens.push(item);
  }

  setNecessidadesBrutas(nomeItem, necessidades = []) {
    let qtdNecessidades = necessidades.length;

    // Nº de necessidades diferente ao nº de períodos
    if (qtdNecessidades != this.qtdPeriodos) {
      if (qtdNecessidades > this.qtdPeriodos)
        console.error(`[ERRO] Nº de necessidades brutas (${qtdNecessidades}) superior ao nº de períodos configurado (${this.qtdPeriodos})!`)
      else
        console.error(`[ERRO] Nº de necessidades brutas (${qtdNecessidades}) inferior ao nº de períodos configurado (${this.qtdPeriodos})!`)

      return false;
    }
  
    this.getItemByNome(nomeItem).necesidadesBrutas = necessidades;
  }

  setRecebimentosProgramados(nomeItem, recebimentos = []) {
    let qtdRecebimentos = recebimentos.length;

    // Nº de recebimentos diferente ao nº de períodos
    if (qtdRecebimentos != this.qtdPeriodos) {
      if (qtdRecebimentos > this.qtdPeriodos)
        console.error(`[ERRO] Nº de recebimentos programados (${qtdRecebimentos}) superior ao nº de períodos configurado (${this.qtdPeriodos})!`)
      else
        console.error(`[ERRO] Nº de recebimentos programados (${qtdRecebimentos}) inferior ao nº de períodos configurado (${this.qtdPeriodos})!`)

      return false;
    }

    this.getItemByNome(nomeItem).recebimentosProgramados = recebimentos;
  }

  calcMRPs() {
    this._calcMRP(this.getRaiz(), null);
  }

  _calcMRP(item, pai) {
    // Caso não seja raiz, as necessidades brutas deste item será igual a liberação de ordens planejadas do pai * quantidade necessária de dependência
    if (pai !== null) {
      // Quantidade necessária de dependência
      let multiplicador = pai.dependencias.find(d => d.nome === item.nome).qtd;
      // Atribuição de necessidades brutas a partir do pai, considerando a quantidade necessária
      item.necesidadesBrutas = pai.liberacaoOrdensPlanejadas.map(ordem => ordem * multiplicador);
    }

    // Calcula MRP
    item.calc();

    // Caso possua filhos
    if (item.dependencias.length > 0) {
      let filhos = this.getFilhos(item);
      for (const filho of filhos) {
        this._calcMRP(filho, item);
      }
    }
  }

  getRaiz() {
    return this.itens.find(i => i.dependente === null);
  }

  getFilhos(item) {
    let filhos = [];
    for (const dependencia of item.dependencias)
      filhos.push(this.getItemByNome(dependencia.nome));

    return filhos;
  }

  getItemByNome(nome) {
    return this.itens.find(i => i.nome === nome);
  }
}

class MRP{
  constructor() { 
    this.necesidadesBrutas = [];
    this.recebimentosProgramados = [];
    this.estoqueProjetado = [];
    this.recebimentoOrdensPlanejadas = [];
    this.liberacaoOrdensPlanejadas = [];
  }

  calc() {
    // Para cada periodo (i + 1)
    for (let i = 0; i < this.necesidadesBrutas.length; i++) {
      // Necessidade do periodo atual
      let necessidade = this.necesidadesBrutas[i];
      
      // Recebimento programado para aquele período + estoque do período anterior ou inicial (caso seja o 1º período)
      let estoqueAnterior = this.estoqueProjetado[i - 1];
      let estoque = this.recebimentosProgramados[i] + (estoqueAnterior !== undefined ? estoqueAnterior : this.estoqueInicial);

      // Diferença entre o estoque e a necessidade
      let diferenca = estoque - necessidade;

      // Caso o estoque seja insuficiente para a necessidade ou inferior ao estoque de segurança, será necessário realizar uma ordem
      if (diferenca < 0 || diferenca < this.estoqueSeguranca) {
        // Verifica stock out por lead time alto, ou seja, por não haver tempo o suficiente para pedir
        if (i - this.leadTime < 0) {
          console.error(`[ERRO] STOCK OUT: Devido o lead time (${this.leadTime}) do item ${this.nome}, não será possível liberar uma ordem a tempo para a necessidade bruta (${necessidade}) do período ${i+1}!`);
          return false;
        }

        // A ordem será o módulo da diferença (a quantidade faltante)
        let ordem = Math.abs(diferenca);
        // Diferença entre o estoque projetado e o estoque de segurança
        let difProjetadoSeguranca = ((estoque + ordem) - necessidade) - this.estoqueSeguranca;
        // Caso seja insifuciente, completar a ordem com a diferença necessária
        if (difProjetadoSeguranca < 0)
          ordem += Math.abs(difProjetadoSeguranca);
        
        // Considerar tipo e quantidade do lote
        switch (this.lote.tipo) {
          case 'mínimo':
            // Se a ordem foi maior ou igual que o mínimo, será a ordem. Caso contrário, será o valor mínimo
            ordem = ordem >= this.lote.qtd ? ordem : this.lote.qtd;
            break;
        
          case 'múltiplo':
            // Obter o módulo da ordem com relação a quantidade do lote
            let mod = ordem % this.lote.qtd;
            // Caso o módulo não seja múltiplo (se for múltiplo, não precisa fazer nada)
            if (mod !== 0) {
              // Adicionar a quantidade faltante para ser múltiplo
              ordem += this.lote.qtd - mod;
            }
            break;

          default: 
            console.error(`[ERRO] Tipo de lote (${this.lote.tipo}) não reconhecido!`)
            break;
        }

        // Adiciona uma liberação de ordem planejada no periodo a tempo para essa necessidade bruta
        this.liberacaoOrdensPlanejadas[i - this.leadTime] = ordem;

        // Adiciona um recebimento de ordem planejada no período que será necessário
        this.recebimentoOrdensPlanejadas[i] = ordem;

        // Adiciona um estoque projetado no período que será utilizado
        this.estoqueProjetado[i] = (estoque + ordem) - necessidade;
      } else {
        // Caso o estoque seja suficiente, não será necessário fazer uma ordem
        // Caso esteja dentro do período previsto pelo MRP, adicionar uma liberação de ordem zerada no período - lead time
        if (i - this.leadTime >= 0) 
          this.liberacaoOrdensPlanejadas[i - this.leadTime] = 0; 
        // Zerar recebimento de ordem planejada para aquele período        
        this.recebimentoOrdensPlanejadas[i] = 0;
        // Estoque projetado para aquele período será o restante que não foi utilizado
        this.estoqueProjetado[i] = diferenca;
      }
    }
  }
}

export class Item extends MRP {
  constructor (nome, lote, leadTime, estoqueSeguranca, estoqueInicial, dependente, dependencias = []) {
    super();
    this.nome = nome;
    this.lote = lote;
    this.leadTime = leadTime;
    this.estoqueSeguranca = estoqueSeguranca;
    this.estoqueInicial = estoqueInicial;
    this.dependente = dependente;
    this.dependencias = dependencias;
  }
}

export class Lote {
  constructor(qtd, tipo = 'mínimo') {
    this.qtd = qtd;
    this.tipo = tipo;
  }
}

class Dependencia {
  constructor(nome, qtd = 1) {
    this.nome = nome;
    this.qtd = qtd;
  }
}

// --- CODE ---
// NOTE: o código abaixo reproduz o exemplo do slide de MRP (quadradinhos azuis)
// Árvore de Produção
// let arvoreDeProducao = new ArvoreDeProducao(8);

// // Lapiseira
// arvoreDeProducao.adicionarItem(new Item('Lapiseira', new Lote(1), 0, 0, 0, null, [
//   new Dependencia('Miolo')
// ]));

// // Miolo
// arvoreDeProducao.adicionarItem(new Item('Miolo', new Lote(300), 1, 0, 350, 'Lapiseira', [
//   new Dependencia('Miolo Interno'), 
//   new Dependencia('Grafite', 4) 
// ]));

// // Grafite
// arvoreDeProducao.adicionarItem(new Item('Grafite', new Lote(500, 'múltiplo'), 2, 250, 250, 'Miolo'));

// // Miolo Interno
// arvoreDeProducao.adicionarItem(new Item('Miolo Interno', new Lote(1), 3, 300, 300, 'Miolo', [
//   new Dependencia('Suporte da Garra'), 
//   new Dependencia('Garra', 3) 
// ]));

// // Suporte da Garra
// arvoreDeProducao.adicionarItem(new Item('Suporte da Garra', new Lote(500), 2, 100, 120, 'Miolo Interno'));

// // Garra
// arvoreDeProducao.adicionarItem(new Item('Garra', new Lote(1500), 1, 150, 450, 'Miolo Interno'));

// // Adicionar necessidades brutas
// arvoreDeProducao.setNecessidadesBrutas('Lapiseira', [0, 300, 0, 200, 0, 0, 500, 500, 0, 1000]); 

// // Adicionar recebimentos programados
// arvoreDeProducao.setRecebimentosProgramados('Miolo Interno', [0, 0, 300, 0, 0, 0, 0, 0, 0, 0]); 

// // Calcular MRPs
// arvoreDeProducao.calcMRPs();

// module.exports = {arvoreDeProducao}