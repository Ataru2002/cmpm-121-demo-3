export interface Cell {
  x: number;
  y: number;
}

export interface Coins {
  coord: Cell;
  serial: number;
}

export class Board {
  private knownCells: Map<string, Cell>;

  constructor() {
    this.knownCells = new Map();
  }

  getGridCell(x: number, y: number): Cell {
    const step = 0.0001;
    const i = Math.round(x / step);
    const j = Math.round(y / step);
    const key = `${i}_${j}`;
    if (this.knownCells.has(key)) {
      return this.knownCells.get(key)!;
    }
    const newCell: Cell = { x: i, y: j };
    this.knownCells.set(key, newCell);
    return newCell;
  }

  getBoard(): Map<string, Cell> {
    return this.knownCells;
  }

  printBoard() {
    console.log(this.knownCells);
  }

  clearBoard() {
    this.knownCells.clear();
  }
}

export class Cache {
  coinList: Coins[];
  formatList: string[];
  cell: Cell;
  description: string;

  constructor(cell: Cell) {
    this.description = ``;
    this.cell = cell;
    this.coinList = [];
    this.formatList = [];
  }

  addCoin() {
    const curSerial: number =
      this.coinList.length > 0
        ? this.coinList[this.coinList.length - 1].serial + 1
        : 0;
    this.coinList.push({ coord: this.cell, serial: curSerial });
    this.formatList.push(`${this.cell.x}#${this.cell.y}#${curSerial}`);
    this.description = this.formatList.join(",");
  }

  format(): string[] {
    const res: string[] = [];
    console.log("AHHHHHH: ", this.coinList);
    if (this.coinList) {
      this.coinList.map((coin) => {
        res.push(`${coin.coord.x}:${coin.coord.y}#${coin.serial}`);
      });
    }
    //console.log(res);
    return res;
  }

  toMomento(): string {
    return this.description;
  }

  fromMomento(momento: string) {
    this.coinList = [];
    if (momento != ``) {
      this.formatList = momento.split(",");
      this.formatList.forEach((instance) => {
        const tempArr: string[] = instance.split("#");
        this.coinList.push({ coord: this.cell, serial: Number(tempArr[2]) });
      });
    }
    console.log("momento: ", momento);
    console.log(this.coinList);
    this.description = momento;
  }
}
