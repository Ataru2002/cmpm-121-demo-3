import "leaflet/dist/leaflet.css";
import "./style.css";
import { Board, Cache } from "./block.ts";
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
const cacheList: Map<string, Cache> = new Map<string, Cache>();

currentMap.getGridCell(MERRILL_CLASSROOM.lat, MERRILL_CLASSROOM.lng);
const playerMarker = leaflet.marker(MERRILL_CLASSROOM);

playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

/*
const sensorButton = document.querySelector("#sensor")!;
sensorButton.addEventListener("click", () => {
  navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  });
});
*/

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [
      MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + j * TILE_DEGREES,
    ],
    [
      MERRILL_CLASSROOM.lat + (i + 1) * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + (j + 1) * TILE_DEGREES,
    ],
  ]);
  const point = currentMap.getGridCell(
    MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
    MERRILL_CLASSROOM.lng + j * TILE_DEGREES
  );
  const key = `${point.x}_${point.y}`;
  cacheList.set(key, new Cache(point));
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    for (let iter = 0; iter < value; iter++) {
      cacheList.get(key)?.addCoin(point);
    }

    //string maker
    const stringAdd: string[] | undefined = cacheList.get(key)?.format();
    let content = `<div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                  <p>Inventory:</p>
                  <div id="scrollableContainer"`;
    for (let iter = 0; iter < value; iter++) {
      if (stringAdd) {
        content += `<p>${stringAdd[iter]}   <button id="collect">collect</button></p>`;
      }
    }
    content += `</div><button id="deposit">deposit</button>`;

    const container = document.createElement("div");
    container.innerHTML = content;

    const collects = container.querySelectorAll<HTMLButtonElement>("#collect")!;
    collects.forEach((collect) => {
      collect.addEventListener("click", () => {
        if (value > 0) {
          value--;
          points++;
        }
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();
        statusPanel.innerHTML = `${points} points accumulated`;
      });
    });

    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      if (points > 0) {
        value++;
        points--;
      }
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      statusPanel.innerHTML = `${points} points accumulated`;
    });
    return container;
  });
  pit.addTo(map);
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(i, j);
    }
  }
}

//currentMap.printBoard();
