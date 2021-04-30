export default class Periodo {
    NecBruta: number;
    RecProg: number;
    EstProj: number;
    RecOrdPlan: number;
    LibOrdPlan: number;

    constructor(NecBruta: number = 0, RecProg: number = 0, EstProj: number = 0, RecOrdPlan: number = 0, LibOrdPlan: number = 0) {
        this.NecBruta = NecBruta;
        this.RecProg = RecProg;
        this.EstProj = EstProj;
        this.RecOrdPlan = RecOrdPlan;
        this.LibOrdPlan = LibOrdPlan;
    }

    ToArray(): number[] {
        let arr = [];

        arr.push(this.NecBruta);
        arr.push(this.RecProg);
        arr.push(this.EstProj);
        arr.push(this.RecOrdPlan);
        arr.push(this.LibOrdPlan);

        return arr;
    }
}