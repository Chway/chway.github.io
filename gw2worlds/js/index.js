const DEBUG = false;
const jsons = { eu: "linksEU.json", na: "linksNA.json" };
const allWorlds = [
  { id: 11001, en: "Moogooloo" },
  { id: 11002, en: "Rall's Rest" },
  { id: 11003, en: "Domain of Torment" },
  { id: 11004, en: "Yohlon Haven" },
  { id: 11005, en: "Tombs of Drascir" },
  { id: 11006, en: "Hall of Judgment" },
  { id: 11007, en: "Throne of Balthazar" },
  { id: 11008, en: "Dwayna's Temple" },
  { id: 11009, en: "Abaddon's Prison" },
  { id: 11010, en: "Cathedral of Blood" },
  { id: 11011, en: "Lutgardis Conservatory" },
  { id: 11012, en: "Mosswood" },
  { id: 12001, en: "Skrittsburgh" },
  { id: 12002, en: "Fortune's Vale" },
  { id: 12003, en: "Silent Woods" },
  { id: 12004, en: "Ettin's Back" },
  { id: 12005, en: "Domain of Anguish" },
  { id: 12006, en: "Palawadan" },
  { id: 12007, en: "Bloodstone Gulch" },
  { id: 12008, en: "Frost Citadel" },
  { id: 12009, en: "Dragrimmar" },
  { id: 12010, en: "Grenth's Door" },
  { id: 12011, en: "Mirror of Lyssa" },
  { id: 12012, en: "Melandru's Dome" },
  { id: 12013, en: "Kormir's Library" },
  { id: 12014, en: "Great House Aviary" },
  { id: 12015, en: "Bava Nisos" },
];
const links = {};

async function setUrl() {
  DEBUG && console.log("setUrl");
  const elementSelectRegion = document.querySelector("#select-region");
  const region = elementSelectRegion.value.toLowerCase();
  const elementSelectWorld = document.querySelector("#select-world");
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex]?.dataset.id;
  const elementSearchGuild = document.querySelector("#search-guild");
  const query = elementSearchGuild.value;
  const paramRegion = `region=${region}`;
  const paramWorld = `&world=${worldId}`;
  const paramSearch = `&search=${query}`;
  history.replaceState(null, "", `?${paramRegion}${worldId ? paramWorld : ""}${query ? paramSearch : ""}`);
}

function toURL() {
  DEBUG && console.log("toUrl");
  const params = new URLSearchParams(window.location.search);
  const paramRegion = params.get("region") || "eu";
  const paramWorld = params.get("world");
  const paramSearch = params.get("search");

  if (paramRegion) {
    const elementSelectRegion = document.querySelector("#select-region");
    for (const region in elementSelectRegion.options) {
      if (elementSelectRegion.options[region].value?.toLowerCase() === paramRegion) {
        elementSelectRegion.options[region].selected = true;
        DEBUG && console.log("toUrl", "elementSelectRegion.dispatchEvent");
        elementSelectRegion.dispatchEvent(new Event("change"));
        break;
      }
    }
  }

  if (paramWorld) {
    const elementSelectWorld = document.querySelector("#select-world");
    for (const world in elementSelectWorld.options) {
      if (elementSelectWorld.options[world].dataset.id === paramWorld) {
        elementSelectWorld.options[world].selected = true;
        if (!paramSearch) {
          DEBUG && console.log("toUrl", "elementSelectWorld.dispatchEvent");
          elementSelectWorld.dispatchEvent(new Event("change"));
        }
        break;
      }
    }
  }

  if (paramSearch) {
    const elementSearchGuild = document.querySelector("#search-guild");
    elementSearchGuild.value = paramSearch;
    DEBUG && console.log("toUrl", "elementSearchGuild.dispatchEvent");
    elementSearchGuild.dispatchEvent(new Event("search"));
  }
}

function getReadableWorld(id) {
  // DEBUG && console.log("getReadableWorld");
  for (const w of allWorlds) {
    if (Number.parseInt(id, 10) === w.id) {
      return w.en;
    }
  }
}

async function removeResults() {
  document.querySelector("#results")?.remove();
}

document.querySelector("#search-guild").addEventListener("search", async (event) => {
  DEBUG && console.log("search-guild");
  const promiseSetUrl = setUrl();

  const promiseRemoveResults = removeResults();
  document.querySelector("#counter").textContent = "";

  const query = event.target.value.toLowerCase();
  const elementSelectWorld = document.querySelector("#select-world");
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex].dataset.id;
  if ((!query && !worldId) || (query && query.length < 2)) {
    await Promise.all([promiseSetUrl, promiseRemoveResults]);
    return;
  }

  const elementSelectRegion = document.querySelector("#select-region");
  const region = elementSelectRegion.value.toLowerCase();

  const isGuildTag = /^\[/.test(query);
  const regex = new RegExp(`${isGuildTag ? "" : "\\b"}${query}`.replace("[", "\\[\\b").replace("]", "\\b\\]"));
  const source = worldId ? links[region][Number.parseInt(worldId, 10)] : Object.values(links[region]).flat();
  const results = source.reduce((accu, value) => {
    const fullName = `${value.n} [${value.t}]`;
    if (query && !regex.test(fullName.toLowerCase())) return accu;
    const readableWorld = getReadableWorld(value.w);
    accu.push({ ...value, ...{ rw: readableWorld } });
    return accu;
  }, []);
  const sortedResults = results.sort((a, b) => a.t.localeCompare(b.t));

  const elementResults = document.createElement("div");
  elementResults.id = "results";
  const templateResult = document.querySelector("#template-result");
  const fragment = new DocumentFragment();
  for (const guild of sortedResults) {
    const clone = templateResult.content.cloneNode(true);
    const spanName = clone.querySelector(".result-name");
    const spanTagName = clone.querySelector(".result-tag-name");
    const spanWorld = clone.querySelector(".result-world");
    spanName.textContent = `${guild.n}`;
    spanTagName.textContent = `${guild.t}`;

    if (!worldId) {
      spanWorld.textContent = `[${guild.rw}]`;
      spanWorld.addEventListener("mouseup", () => {
        for (const world in elementSelectWorld.options) {
          if (elementSelectWorld.options[world].value === guild.rw) {
            event.target.value = "";
            elementSelectWorld.options[world].selected = true;
            elementSelectWorld.dispatchEvent(new Event("change"));
            return;
          }
        }
      });
    }

    fragment.append(clone);
  }

  await promiseRemoveResults;
  elementResults.appendChild(fragment);
  document.querySelector("body").appendChild(elementResults);
  document.querySelector("#counter").textContent = `(${sortedResults.length} guild${sortedResults.length > 1 ? "s" : ""})`;
  window.scrollTo(0, 0);
  await promiseSetUrl;
});

document.querySelector("#select-region").addEventListener("change", async (event) => {
  DEBUG && console.log("select-region");
  populateDropDown();

  if (event.isTrusted) {
    const promiseSetUrl = setUrl();
    const selectWorld = document.querySelector("#select-world");
    DEBUG && console.log("search-region", "elementSelectWorld.dispatchEvent");
    selectWorld.dispatchEvent(new Event("change"));
    await promiseSetUrl;
  }
});

document.querySelector("#select-world").addEventListener("change", async () => {
  DEBUG && console.log("select-world");
  const promiseSetUrl = setUrl();
  const elementSearchGuild = document.querySelector("#search-guild");
  DEBUG && console.log("select-world", "elementSearchGuild.dispatchEvent");
  elementSearchGuild.dispatchEvent(new Event("search"));
  await promiseSetUrl;
});

function populateDropDown() {
  DEBUG && console.log("populateDropDown");
  const selectWorld = document.querySelector("#select-world");
  selectWorld.options.length = 0;
  const option = document.createElement("option");
  selectWorld.add(option);

  const selectRegion = document.querySelector("#select-region");
  const regexRegion = selectRegion.value === "NA" ? new RegExp(/^11/) : new RegExp(/^12/);
  const sorted = allWorlds.sort((a, b) => a.en.localeCompare(b.en));
  for (const world of sorted) {
    if (!regexRegion.test(world.id)) continue;
    const option = document.createElement("option");
    option.text = world.en;
    option.dataset.id = world.id;
    selectWorld.add(option);
  }
}

async function Job() {
  DEBUG && console.log("Job");
  const promises = [fetch(jsons.eu).then((response) => response.json()), fetch(jsons.na).then((response) => response.json())];
  [links.eu, links.na] = await Promise.all(promises);
  // populateDropDown();
  toURL();
}

await Job();
