import Periodo from './periodo.model';

export default class Item {
    ID: number;
    Nome: string;
    Dependencias: number[];
    Lote: number;
    LT: number;
    ES: number;
    EI: number;
    Periodos: Periodo[];

    constructor(id: number, Nome: string, Dependencias: number[], Lote: number, LT: number, ES: number, EI: number, demandaInicial: number[]) {
        this.ID = id;
        this.Nome = Nome;
        this.Dependencias = Dependencias;
        this.Lote = Lote;
        this.LT = LT;
        this.ES = ES;
        this.EI = EI;
        this.Periodos = demandaInicial.map(item => new Periodo(item));
    }
}