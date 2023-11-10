import "leaflet/dist/leaflet.css";
import "./style.css";
import { Board, Cache, Cell } from "./block.ts";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
  })
  .addTo(map);

const currentMap: Board = new Board();
const cacheList: Map<Cell, Cache> = new Map<Cell, Cache>();
const momentos: Map<Cell, string> = new Map<Cell, string>();
const cacheMap: Map<Cell, [leaflet.Layer, boolean]> = new Map<
  Cell,
  [leaflet.Layer, boolean]
>();
const south = document.getElementById("south");
const north = document.getElementById("north");
const east = document.getElementById("east");
const west = document.getElementById("west");

currentMap.getGridCell(MERRILL_CLASSROOM.lat, MERRILL_CLASSROOM.lng);
const playerMarker = leaflet.marker(MERRILL_CLASSROOM);

playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [
      playerMarker.getLatLng().lat + i * TILE_DEGREES,
      playerMarker.getLatLng().lng + j * TILE_DEGREES,
    ],
    [
      playerMarker.getLatLng().lat + (i + 1) * TILE_DEGREES,
      playerMarker.getLatLng().lng + (j + 1) * TILE_DEGREES,
    ],
  ]);
  const point = currentMap.getGridCell(
    playerMarker.getLatLng().lat + i * TILE_DEGREES,
    playerMarker.getLatLng().lng + j * TILE_DEGREES
  );
  cacheList.set(point, new Cache(point));
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;
  cacheMap.set(point, [pit, true]);

  const value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
  for (let iter = 0; iter < value; iter++) {
    cacheList.get(point)?.addCoin();
  }
  momentos.set(point, cacheList.get(point)!.toMomento());

  pit.bindPopup(() => {
    //string maker
    const stringAdd: string[] = cacheList.get(point)!.format();
    const content = messageGen(i, j, Number(momentos.get(point)), stringAdd);

    const container = document.createElement("div");
    container.innerHTML = content;

    const collects = container.querySelectorAll<HTMLButtonElement>("#collect")!;
    collects.forEach((collect) => {
      collect.addEventListener("click", () => {
        let curValue = Number(momentos.get(point));
        if (curValue > 0) {
          curValue--;
          points++;
        }
        console.log(curValue);
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          curValue.toString();
        statusPanel.innerHTML = `${points} points accumulated`;
        momentos.set(point, curValue.toString());
        cacheList.get(point)?.fromMomento(curValue.toString());
      });
    });

    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      let curValue = Number(momentos.get(point));
      if (points > 0) {
        curValue++;
        points--;
      }
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        curValue.toString();
      statusPanel.innerHTML = `${points} points accumulated`;
      momentos.set(point, curValue.toString());
      cacheList.get(point)?.fromMomento(curValue.toString());
    });
    return container;
  });
  pit.addTo(map);
}

function pitSpawner() {
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
        makePit(i, j);
      }
    }
  }
}

function messageGen(
  xDiff: number,
  yDiff: number,
  value: number,
  list: string[]
): string {
  let content = `<div>There is a pit here at "${xDiff},${yDiff}". It has value <span id="value">${value}</span>.</div>
                  <p>Inventory:</p>
                  <div id="scrollableContainer"`;
  for (let iter = 0; iter < value; iter++) {
    if (list) {
      content += `<p>${list[iter]}   <button id="collect">collect</button></p>`;
    }
  }
  content += `</div><button id="deposit">deposit</button>`;
  return content;
}

pitSpawner();

function updater(cacheMap: Map<Cell, [leaflet.Layer, boolean]>) {
  const playerCell: Cell = currentMap.getGridCell(
    playerMarker.getLatLng().lat,
    playerMarker.getLatLng().lng
  );
  cacheMap.forEach((cache, cell) => {
    let eraser = false;
    if (Math.abs(cell.x - playerCell.x) > NEIGHBORHOOD_SIZE) {
      eraser = true;
    }
    if (Math.abs(cell.y - playerCell.y) > NEIGHBORHOOD_SIZE) {
      eraser = true;
    }
    if (eraser && cache[1]) {
      cache[0].remove();
      cache[1] = false;
    } else if (!eraser && !cache[1]) {
      cache[0].addTo(map);
      cache[1] = true;
    }
  });
}

//currentMap.printBoard();

south?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat - 0.0001,
    lng: playerMarker.getLatLng().lng,
  });
  updater(cacheMap);
  //pitSpawner();
});

north?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat + 0.0001,
    lng: playerMarker.getLatLng().lng,
  });
  updater(cacheMap);
  //pitSpawner();
});

east?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat,
    lng: playerMarker.getLatLng().lng + 0.0001,
  });
  updater(cacheMap);
  //pitSpawner();
});

west?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat,
    lng: playerMarker.getLatLng().lng - 0.0001,
  });
  updater(cacheMap);
  //pitSpawner();
});
