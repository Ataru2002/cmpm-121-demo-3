interface Coins {
  x: number;
  y: number;
  serial: number;
}

interface Cell {
  x: number;
  y: number;
  coinList: Coins[];
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
    const newCell: Cell = { x: i, y: j, coinList: [] };
    this.knownCells.set(key, newCell);
    return newCell;
  }

  printBoard() {
    console.log(this.knownCells);
  }

  addCoin(x: number, y: number) {
    const step = 0.0001;
    const i = Math.round(x / step);
    const j = Math.round(y / step);
    const cur = this.getGridCell(x, y);
    const curSerial: number =
      cur.coinList.length > 0
        ? cur.coinList[cur.coinList.length - 1].serial + 1
        : 0;
    cur.coinList.push({ x: i, y: j, serial: curSerial });
  }
}
