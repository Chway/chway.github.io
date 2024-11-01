import { ALLWORLDS, DEBUG, JSONS, LASTUPDATE, LINKS } from "./index.js";

export function getRegion() {
  const radios = document.querySelectorAll("#top #region input");
  const selected = {};
  for (const radio of Array.from(radios)) {
    if (radio.checked) {
      selected.value = radio.value;
      selected.element = radio;
      return selected;
    }
  }
}

export function setRegion(region) {
  const radios = document.querySelectorAll("#top #region input");
  for (const radio of Array.from(radios)) {
    if (radio.value === region) {
      radio.checked = true;
      return;
    }
  }
}

export function getSorting() {
  const radios = document.querySelectorAll("#top #sort input");
  const selected = {};
  for (const radio of Array.from(radios)) {
    if (radio.checked) {
      selected.value = radio.value;
      selected.element = radio;
      return selected;
    }
  }
}

export function setSorting(type) {
  const radios = document.querySelectorAll("#top #sort input");
  for (const radio of Array.from(radios)) {
    if (radio.value === type) {
      radio.checked = true;
      return;
    }
  }
}

export async function loadLinks(region) {
  DEBUG && console.log(`1) loadLinks() (region: ${region})`);
  const response = await fetch(JSONS[region]);
  const json = await response.json();
  LINKS[region] = json.worlds;
  LASTUPDATE[region] = json.lastModified;
}

export function getReadableWorld(id, region) {
  // DEBUG && console.log(`1) getReadableWorld() (id: ${id}, region: ${region})`);
  if (region && region.toLowerCase() !== "eu" && region && region.toLowerCase() !== "na") return;
  const regexRegion = region === "na" ? new RegExp(/^11/) : new RegExp(/^12/);

  for (const w of ALLWORLDS) {
    if (Number.parseInt(id, 10) === w.id) {
      if (!region || (region && regexRegion.test(w.id))) {
        return w.en;
      }
      break;
    }
  }
}

export function getLastFetched(region) {
  DEBUG && console.log("1) getLastFetched()");
  return new Date(LASTUPDATE[region]).toLocaleString(undefined, {
    timeZoneName: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function removeResults() {
  DEBUG && console.log("1) removeResults()");
  document.querySelector("#results")?.remove();
  document.querySelector("#stats")?.remove();
}

export async function setURL() {
  DEBUG && console.log("1) setURL()");
  const elementSelectWorld = document.querySelector("#select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  const region = getRegion().value;
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex]?.dataset.id;
  const query = elementSearchGuild.value;
  const paramRegion = `region=${region}`;
  const paramWorld = `&world=${worldId}`;
  const paramSearch = `&search=${query}`;
  const state = { region: region, world: worldId, search: query };
  history.pushState(state, "", `?${paramRegion}${worldId ? paramWorld : ""}${query ? paramSearch : ""}`);
  document.title = `${query ? `${query} - ` : ""}${worldId ? `${getReadableWorld(worldId, region)} - ` : ""}GW2Worlds`;
}

export function populateDropDown(region) {
  DEBUG && console.log(`1) populateDropdown() (region: ${region})`);
  const selectWorld = document.querySelector("#select-world");
  selectWorld.options.length = 0;
  const option = document.createElement("option");
  selectWorld.add(option);
  selectWorld.selected = true;

  const regexRegion = region === "na" ? new RegExp(/^11/) : new RegExp(/^12/);
  const sorted = ALLWORLDS.sort((a, b) => a.en.localeCompare(b.en));
  for (const world of sorted) {
    if (!regexRegion.test(world.id)) continue;
    const option = document.createElement("option");
    option.text = world.en;
    option.dataset.id = world.id;
    selectWorld.add(option);
  }
}
