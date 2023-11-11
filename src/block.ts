export interface Cell {
  x: number;
  y: number;
}

interface Coins {
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

  printBoard() {
    console.log(this.knownCells);
  }

  clearBoard() {
    this.knownCells.clear();
  }
}

export class Cache {
  coinList: Coins[];
  cell: Cell;
  description: string;

  constructor(cell: Cell) {
    this.description = ``;
    this.cell = cell;
    this.coinList = [];
  }

  addCoin() {
    const curSerial: number =
      this.coinList.length > 0
        ? this.coinList[this.coinList.length - 1].serial + 1
        : 0;
    this.coinList.push({ coord: this.cell, serial: curSerial });
    this.description = this.coinList.length.toString();
  }

  format(): string[] {
    const res: string[] = [];
    this.coinList.map((coin) => {
      res.push(`${coin.coord.x}:${coin.coord.y}#${coin.serial}`);
    });
    return res;
  }

  toMomento(): string {
    return this.description;
  }

  fromMomento(momento: string) {
    this.description = momento;
  }
}
