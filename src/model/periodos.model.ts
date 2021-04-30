import Periodo from "./periodo.model";

export default class Periodos {
    NecBruta: number[];
    RecProg: number[];
    EstProj: number[];
    RecOrdPlan: number[];
    LibOrdPlan: number[];

    constructor(periodos: Periodo[]) {
        this.NecBruta = periodos.map(item => item.NecBruta);
        this.RecProg = periodos.map(item => item.RecProg);
        this.EstProj = periodos.map(item => item.EstProj);
        this.RecOrdPlan = periodos.map(item => item.RecOrdPlan);
        this.LibOrdPlan = periodos.map(item => item.LibOrdPlan);
    }
}