let PREV = false;
const DEBUG = false;
const JSONS = { eu: "linksEU.json", na: "linksNA.json" };
const ALLWORLDS = [
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
const LINKS = {};

window.addEventListener("popstate", async (event) => {
  PREV = true;
  await toURL(event.state);
});

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
  document.title = `GW2Worlds - ${worldId ? getReadableWorld(worldId) : elementSelectRegion.value}${query ? " - Search" : ""}`;

  const state = { region: region, world: worldId, search: query };
  history.pushState(state, "", `?${paramRegion}${worldId ? paramWorld : ""}${query ? paramSearch : ""}`);
}

async function toURL(prevState) {
  DEBUG && console.log("toUrl", prevState);
  const params = new URLSearchParams(window.location.search);
  let paramRegion = prevState ? prevState.region : (params.get("region") || "eu").toLowerCase();
  let paramWorld = prevState ? prevState.world : params.get("world");
  const paramSearch = prevState ? prevState.search : params.get("search");
  const elementSelectRegion = document.querySelector("#select-region");
  const elementSelectWorld = document.querySelector("#select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  if (prevState && !prevState.world) paramWorld = 1;
  const badUrl = { region: true, world: Boolean(paramWorld) };

  if (!Object.hasOwn(LINKS, paramRegion)) {
    DEBUG && console.log("toUrl - !Object.hasOwn(LINKS, paramRegion)");
    if (paramRegion !== "eu" && paramRegion !== "na") {
      paramRegion = "eu";
    } else {
      badUrl.region = false;
    }

    await loadLinks(paramRegion);
    populateDropDown(paramRegion);

    for (const region in elementSelectRegion.options) {
      if (elementSelectRegion.options[region].value?.toLowerCase() === paramRegion) {
        elementSelectRegion.options[region].selected = true;
        break;
      }
    }
  } else {
    badUrl.region = false;
  }

  if (!badUrl.region && paramWorld) {
    DEBUG && console.log("toUrl - paramWorld");
    for (const world in elementSelectWorld.options) {
      if ((prevState && paramWorld === 1) || elementSelectWorld.options[world].dataset?.id === paramWorld) {
        elementSelectWorld.options[world].selected = true;
        badUrl.world = false;
        break;
      }
    }
  }

  if (!badUrl.region && !badUrl.world && paramSearch) {
    DEBUG && console.log("toUrl - paramSearch");
    elementSearchGuild.value = paramSearch;
  }

  DEBUG && console.log("toUrl - elementSearchGuild.dispatchEvent");
  elementSearchGuild.dispatchEvent(new Event("search"));
}

function getReadableWorld(id) {
  // DEBUG && console.log("getReadableWorld");
  for (const w of ALLWORLDS) {
    if (Number.parseInt(id, 10) === w.id) {
      return w.en;
    }
  }
}

async function removeResults() {
  document.querySelector("#results")?.remove();
}

document.querySelector("#search-guild").addEventListener("search", async (event) => {
  DEBUG && console.log(`search-guild - prevState: ${PREV}`);

  let promiseSetUrl;
  if (!PREV) {
    promiseSetUrl = setUrl();
  }

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
  const source = worldId ? LINKS[region][Number.parseInt(worldId, 10)] : Object.values(LINKS[region]).flat();
  const results = source.reduce((accu, value) => {
    const fullName = `${value.n} [${value.t}]`.toLowerCase();
    if (query && !regex.test(fullName)) return accu;
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
    const spanWorldName = clone.querySelector(".result-world-name");
    spanName.textContent = `${guild.n}`;
    spanTagName.textContent = `${guild.t}`;

    if (!worldId) {
      spanWorldName.textContent = guild.rw;
      spanWorldName.addEventListener("click", (event) => {
        const elementSelectWorld = document.querySelector("#select-world");
        const elementSearchGuild = document.querySelector("#search-guild");
        for (const world in elementSelectWorld.options) {
          if (elementSelectWorld.options[world].value === event.target.textContent) {
            elementSearchGuild.value = "";
            elementSelectWorld.options[world].selected = true;
            elementSearchGuild.dispatchEvent(new Event("search"));
            return;
          }
        }
      });
    } else {
      spanWorld.remove();
    }

    fragment.append(clone);
  }

  await promiseRemoveResults;
  elementResults.appendChild(fragment);
  document.querySelector("body").appendChild(elementResults);
  document.querySelector("#counter").textContent = `(${sortedResults.length} guild${sortedResults.length > 1 ? "s" : ""})`;
  window.scrollTo(0, 0);
  await promiseSetUrl;
  PREV = false;
});

document.querySelector("#select-region").addEventListener("change", async (event) => {
  DEBUG && console.log("select-region");
  if (event.isTrusted) {
    DEBUG && console.log("select-region - isTrusted");
    const region = event.target.value.toLowerCase();
    if (!Object.hasOwn(LINKS, region)) {
      DEBUG && console.log("select-region - loadLinks");
      await loadLinks(region);
    }

    populateDropDown(region);
    const selectWorld = document.querySelector("#select-world");
    DEBUG && console.log("search-region - elementSelectWorld.dispatchEvent");
    selectWorld.dispatchEvent(new Event("change"));
  }
});

document.querySelector("#select-world").addEventListener("change", async () => {
  DEBUG && console.log("select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  DEBUG && console.log("select-world - elementSearchGuild.dispatchEvent");
  elementSearchGuild.dispatchEvent(new Event("search"));
});

function populateDropDown(region) {
  DEBUG && console.log("populateDropDown");
  const selectWorld = document.querySelector("#select-world");
  selectWorld.options.length = 0;
  const option = document.createElement("option");
  selectWorld.add(option);

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

async function loadLinks(region) {
  const response = await fetch(JSONS[region]);
  const json = await response.json();
  LINKS[region] = json;
}

async function Job() {
  DEBUG && console.log("Job");
  toURL();
}

await Job();
