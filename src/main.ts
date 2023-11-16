import "leaflet/dist/leaflet.css";
import "./style.css";
import { Board, Cache, Cell, Coins } from "./block.ts";
import leaflet, { polyline } from "leaflet";
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
//const momentos: Map<Cell, string> = new Map<Cell, string>();
const cacheMap: Map<Cell, [leaflet.Layer, boolean]> = new Map<
  Cell,
  [leaflet.Layer, boolean]
>();
let playerCoins: Coins[] = [];
let movements: leaflet.LatLng[] = [];
let polylineArray: leaflet.Polyline[] = [];

const south = document.getElementById("south");
const north = document.getElementById("north");
const east = document.getElementById("east");
const west = document.getElementById("west");
const sensor = document.getElementById("sensor");
const reset = document.getElementById("reset");

if (localStorage.getItem("player") == null) {
  localStorage.setItem("player", ``);
} else if (localStorage.getItem(`player`)) {
  const temp = localStorage.getItem(`player`)?.split(",");
  temp?.splice(temp.length - 1, 1);
  temp?.forEach((instance) => {
    const temp2 = instance.split("#");
    playerCoins.push({
      coord: { x: Number(temp2[0]), y: Number(temp2[1]) },
      serial: Number(temp2[2]),
    });
  });
}

currentMap.getGridCell(MERRILL_CLASSROOM.lat, MERRILL_CLASSROOM.lng);
const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
movements.push(playerMarker.getLatLng());
let playerPath = polyline(movements, { color: `red` });
polylineArray.push(playerPath);

playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
console.log(playerCoins);
if (playerCoins.length > 0) {
  statusPanel.innerHTML = `${playerCoins.length} points accumulated`;
} else {
  statusPanel.innerHTML = `No points accumulated`;
}
function makePit(i: number, j: number) {
  //setup the maps
  const bounds = leaflet.latLngBounds([
    [i, j],
    [i + 1 * TILE_DEGREES, j + 1 * TILE_DEGREES],
  ]);
  const point = currentMap.getGridCell(i, j);
  cacheList.set(point, new Cache(point));
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;
  cacheMap.set(point, [pit, true]);

  //momentos.set(point, cacheList.get(point)!.toMomento());
  //setup local storage
  if (localStorage.getItem(JSON.stringify(point)) == null) {
    const value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    for (let iter = 0; iter < value; iter++) {
      cacheList.get(point)?.addCoin();
    }
    localStorage.setItem(
      JSON.stringify(point),
      cacheList.get(point)!.toMomento()
    );
  } else {
    const curValue = localStorage.getItem(JSON.stringify(point));
    cacheList.get(point)?.fromMomento(curValue!);
  }

  //popup
  pit.bindPopup(() => {
    //string maker
    const pointS = JSON.stringify(point);
    const stringAdd: string[] = cacheList.get(point)!.format();
    //const content = messageGen(i, j, Number(momentos.get(point)), stringAdd);
    const content = messageGen(
      i,
      j,
      localStorage.getItem(pointS)!.split(",").length,
      stringAdd
    );
    const container = document.createElement("div");
    container.id = "popup";
    container.innerHTML = content;

    container.addEventListener("click", () => {
      map.setView(
        leaflet.latLng({
          lat: point.x * TILE_DEGREES,
          lng: point.y * TILE_DEGREES,
        })
      );
    });

    const collects = container.querySelectorAll<HTMLButtonElement>("#collect")!;
    collects.forEach((collect, index) => {
      collect.addEventListener("click", () => {
        const curValue = localStorage.getItem(pointS)?.split(",");
        //change score
        if (curValue) {
          const temp = curValue[index].split("#");
          let tempStr = localStorage.getItem(`player`);
          playerCoins.push({
            coord: { x: Number(temp[0]), y: Number(temp[1]) },
            serial: Number(temp[2]),
          });
          tempStr += curValue[index];
          tempStr += ",";
          localStorage.setItem(`player`, tempStr!);
        }
        //change storage
        curValue?.splice(index, 1);
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          curValue!.length.toString();
        console.log(playerCoins.length);
        statusPanel.innerHTML = `${playerCoins.length} points accumulated`;
        //momento
        localStorage.setItem(JSON.stringify(point), curValue!.join(","));
        cacheList.get(point)?.fromMomento(curValue!.join(","));
        messageChange(
          localStorage.getItem(pointS)!.split(",").length,
          curValue!
        );
      });
    });

    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      const curValue = localStorage.getItem(pointS)?.split(",");
      const chosenCoin = playerCoins[playerCoins.length - 1];
      const temp = `${chosenCoin.coord.x}#${chosenCoin.coord.y}#${chosenCoin.serial}`;
      curValue?.push(temp);
      playerCoins.splice(playerCoins.length - 1, 1);

      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        curValue!.length.toString();
      if (playerCoins.length == 0) {
        statusPanel.innerHTML = `No points accumulated`;
      } else {
        statusPanel.innerHTML = `${playerCoins.length} points accumulated`;
      }
      //momentos.set(point, curValue.toString());
      localStorage.setItem(JSON.stringify(point), curValue!.join(","));
      cacheList.get(point)?.fromMomento(curValue!.join(","));
      messageChange(localStorage.getItem(pointS)!.split(",").length, curValue!);
    });
    return container;
  });

  pit.addTo(map);
}

function potentialpits(curLocation: leaflet.LatLng) {
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      currentMap.getGridCell(
        curLocation.lat + i * TILE_DEGREES,
        curLocation.lng + j * TILE_DEGREES
      );
    }
  }
}

function pitSpawner() {
  const state = currentMap.getBoard();
  state.forEach((cell) => {
    if (
      luck([cell.x * TILE_DEGREES, cell.y * TILE_DEGREES].toString()) <
        PIT_SPAWN_PROBABILITY &&
      !cacheList.has(cell) &&
      !cacheMap.has(cell)
    ) {
      makePit(cell.x * TILE_DEGREES, cell.y * TILE_DEGREES);
    }
  });
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
      content += `<p id="delete${iter}">${list[iter]}   <button id="collect">collect</button></p>`;
    }
  }
  content += `</div><button id="deposit">deposit</button>`;
  return content;
}

function messageChange(value: number, list: string[]) {
  const temp = document.getElementById(`scrollableContainer`);
  let content = ``;
  for (let iter = 0; iter < value; iter++) {
    if (list) {
      content += `<p>${list[iter]}   <button id="collect">collect</button></p>`;
    }
  }
  if (temp) {
    temp.innerHTML = content;
  }
}

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
potentialpits(playerMarker.getLatLng());
pitSpawner();

south?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat - 0.0001,
    lng: playerMarker.getLatLng().lng,
  });
  map.setView(playerMarker.getLatLng());
  movements.push(playerMarker.getLatLng());
  playerPath = polyline(movements, { color: `red` }).addTo(map);
  polylineArray.push(playerPath);
  updater(cacheMap);
  potentialpits(playerMarker.getLatLng());
  pitSpawner();
});

north?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat + 0.0001,
    lng: playerMarker.getLatLng().lng,
  });
  map.setView(playerMarker.getLatLng());
  movements.push(playerMarker.getLatLng());
  playerPath = polyline(movements, { color: `red` }).addTo(map);
  polylineArray.push(playerPath);
  updater(cacheMap);
  potentialpits(playerMarker.getLatLng());
  pitSpawner();
});

east?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat,
    lng: playerMarker.getLatLng().lng + 0.0001,
  });
  map.setView(playerMarker.getLatLng());
  movements.push(playerMarker.getLatLng());
  playerPath = polyline(movements, { color: `red` }).addTo(map);
  polylineArray.push(playerPath);
  updater(cacheMap);
  potentialpits(playerMarker.getLatLng());
  pitSpawner();
});

west?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat,
    lng: playerMarker.getLatLng().lng - 0.0001,
  });
  map.setView(playerMarker.getLatLng());
  movements.push(playerMarker.getLatLng());
  playerPath = polyline(movements, { color: `red` }).addTo(map);
  polylineArray.push(playerPath);
  updater(cacheMap);
  potentialpits(playerMarker.getLatLng());
  pitSpawner();
});

sensor?.addEventListener("click", () => {
  navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
    movements.push(playerMarker.getLatLng());
    playerPath = polyline(movements, { color: `red` }).addTo(map);
    polylineArray.push(playerPath);
    updater(cacheMap);
    potentialpits(playerMarker.getLatLng());
    pitSpawner();
  }),
    function error() {
      alert(`Please enable your GPS position feature.`);
    },
    { maximumAge: 10000, timeout: 5000, enableHighAccuracy: true };
});

reset?.addEventListener("click", () => {
  //return back to spawn
  movements = [];
  polylineArray.forEach((line) => {
    line.remove();
  });
  polylineArray = [];
  playerMarker.setLatLng(MERRILL_CLASSROOM);
  map.setView(playerMarker.getLatLng());
  currentMap.clearBoard(); //clear the board
  cacheList.clear(); //clear all cache in the list
  cacheMap.forEach((cache) => {
    cache[0].remove();
  });
  cacheMap.clear(); //clear all cache on map
  localStorage.clear(); //clear momento
  potentialpits(playerMarker.getLatLng());
  pitSpawner(); //respawn the pits;
  localStorage.setItem("player", ``);
  playerCoins = [];
  statusPanel.innerHTML = "No points yet..."; //reset the points
});
