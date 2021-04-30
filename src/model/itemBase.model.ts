export default class BaseItem {
    nome: string;
    lote: number;
    leadTime: number;
    estoqueSeguranca: number;
    estoqueInicial: number;
    dependente: null;
    dependencias: string[];
}