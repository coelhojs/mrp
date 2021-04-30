import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import Item from 'src/model/item.model';
import Periodo from 'src/model/periodo.model';

import * as mrp from 'src/mrp';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  columns = ['NecBruta', 'RecProg', 'EstProj', 'RecOrdPlan', 'LibOrdPlan'];
  dataSource: MatTableDataSource<Periodo>;
  labels = ["Necessidades brutas", "Recebimentos programados", "Estoque projetado", "Recebimento ordens planejadas", "Liberação ordens planejadas"];
  baseItem: Item;
  item: Item;
  items: Item[];
  itemForm: FormGroup;
  title = 'mrp';

  arvore = new mrp.ArvoreDeProducao(8);

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    if (localStorage.getItem('items') == null) {
      this.populateAndStore();
    } else {
      this.items = JSON.parse(localStorage.getItem('items'));
    }

    this.item = this.items[0];

    this.itemForm = this.fb.group({
      ID: this.item.ID,
      Nome: this.item.Nome,
      Lote: this.item.Lote,
      LT: this.item.LT,
      ES: this.item.ES
    });
  }

  changeItem(event) {
    this.item = this.items.find(item => item.Nome == event.target.selectedOptions[0].text);
  }

  getDataSource(data: Item) {
    return new MatTableDataSource(data.Periodos);
  }

  populateAndStore() {
    this.baseItem = new Item(0, 'Lapiseira P207', [1, 2, 3, 4, 5, 6], 700, 1, 0, 0, [200, 200, 800, 1200, 400, 1200, 1200, 200]);
    this.items = [
      this.baseItem,
      new Item(1, 'Corpo externo 207', [7, 8], 0, 2, 0, 0, new Array(8).fill(0)),
      new Item(2, 'Presilha de bolso', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(3, 'Miolo 207', [10, 11, 12, 13], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(4, 'Corpo da ponteira', [], 0, 2, 0, 0, new Array(8).fill(0)),
      new Item(5, 'Guia da ponteira', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(6, 'Tampa', [9], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(7, 'Plástico ABS', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(8, 'Corante azul', [], 0, 2, 0, 0, new Array(8).fill(0)),
      new Item(9, 'Tira 0,1 mm', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(10, 'Borracha', [14], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(11, 'Capa da borracha', [15], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(12, 'Miolo interno 207', [16, 17, 18, 19, 20], 0, 3, 0, 0, new Array(8).fill(0)),
      new Item(13, 'Grafite 0,7 mm', [], 0, 2, 0, 0, new Array(8).fill(0)),
      new Item(14, 'Fio de borracha', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(15, 'Tira 0,1 mm', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(16, 'Mola', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(17, 'Corpo do miolo', [21, 22], 0, 2, 0, 0, new Array(8).fill(0)),
      new Item(18, 'Suporte da garra', [], 0, 2, 0, 0, new Array(8).fill(0)),
      new Item(19, 'Capa da garra', [], 0, 3, 0, 0, new Array(8).fill(0)),
      new Item(20, 'Garras', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(21, 'Plástico ABS', [], 0, 1, 0, 0, new Array(8).fill(0)),
      new Item(22, 'Corante preto', [], 0, 2, 0, 0, new Array(8).fill(0)),
    ];

    localStorage.setItem('items', JSON.stringify(this.items));
  }

  somethingChanged(event) {
    let name = event.target.name.split('.');

    let index = this.items.findIndex(item => item.ID == name[0]);
    if (name.length == 3) {
      this.items[index].Periodos[name[1]][name[2]] = parseFloat(event.target.value);
    }

    if (name.length == 2) {
      this.item[name[1]] = event.target.value;

      this.items[index] = this.item;
    }

    this.recalcularTudo();

    localStorage.setItem('items', JSON.stringify(this.items));
  }

  recalcularTudo() {

    // 1. Criar e preencher arvore
    this.arvore = new mrp.ArvoreDeProducao(8);

    this.items.forEach(item => {
      this.arvore.adicionarItem(new mrp.Item(item.Nome, new mrp.Lote(1), item.LT, item.ES, item.EI, null, item.Dependencias));
    });
    //...

    // 2. Mandar calcular com arvore.calcMRPs()
    this.arvore.calcMRPs();

    // 3. Percorrer this.itens, atualizando eles de acordo com this.arvore
    for (let item of this.items) {
      // exemplo:
      let baseItem = this.arvore.getItemByNome(item.Nome);

      item.Nome = baseItem.nome;
      item.Lote = baseItem.lote.qtd;
      item.LT = baseItem.leadTime;
      item.ES = baseItem.estoqueSeguranca;
      item.EI = baseItem.estoqueInicial;
      item.Dependencias = baseItem.dependencias;

      for (let i = 0; i < item.Periodos.length; i++) {
        item.Periodos[i].EstProj = baseItem.estoqueProjetado[i] || 0;
        item.Periodos[i].LibOrdPlan = baseItem.liberacaoOrdensPlanejadas[i] || 0;
        item.Periodos[i].RecOrdPlan = baseItem.recebimentoOrdensPlanejadas[i] || 0;
        item.Periodos[i].RecProg = baseItem.recebimentosProgramados[i] || 0;
        item.Periodos[i].NecBruta = baseItem.necesidadesBrutas[i] || 0;

        if (item.Nome == "Lapiseira P207") {
          console.log(baseItem);
          console.log(item);
        }
      }
    }
  }
}
