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
const LASTUPDATE = {};

document.querySelector("#go-to-top").addEventListener("click", () => {
  window.scrollTo(0, 0);
});

window.onscroll = () => {
  const elementGoToTop = document.querySelector("#go-to-top");
  elementGoToTop.style.display = window.scrollY ? "block" : "none";
};

window.addEventListener("popstate", async (event) => {
  await toURL(event.state);
});

function getLastFetched(region) {
  return new Date(LASTUPDATE[region]).toLocaleString(undefined, {
    timeZoneName: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function setURL() {
  DEBUG && console.log("1) setURL()");
  const elementSelectRegion = document.querySelector("#select-region");
  const elementSelectWorld = document.querySelector("#select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  const region = elementSelectRegion.value.toLowerCase();
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex]?.dataset.id;
  const query = elementSearchGuild.value;
  const paramRegion = `region=${region}`;
  const paramWorld = `&world=${worldId}`;
  const paramSearch = `&search=${query}`;

  const state = { region: region, world: worldId, search: query };
  history.pushState(state, "", `?${paramRegion}${worldId ? paramWorld : ""}${query ? paramSearch : ""}`);
  document.title = `GW2Worlds - ${worldId ? getReadableWorld(worldId, region) : elementSelectRegion.value}${query ? ` - ${query}` : ""}`;
}

async function toURL(prevState) {
  DEBUG && console.log(`1) toURL() (prevState: ${Boolean(prevState)})`);
  const params = new URLSearchParams(window.location.search);
  let paramRegion = prevState ? prevState.region : (params.get("region") || "eu").toLowerCase();
  const paramWorld = prevState ? prevState.world : params.get("world");
  let paramSearch = prevState ? prevState.search : params.get("search");
  const elementSelectRegion = document.querySelector("#select-region");
  const elementSelectWorld = document.querySelector("#select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  if (prevState && !prevState.search) paramSearch = "";
  const notValid = (paramRegion !== "eu" && paramRegion !== "na") || (paramWorld && !getReadableWorld(paramWorld, paramRegion));
  if (paramRegion !== "eu" && paramRegion !== "na") paramRegion = "eu";

  if (!Object.hasOwn(LINKS, paramRegion)) {
    await loadLinks(paramRegion);
  }
  populateDropDown(paramRegion);
  document.querySelector("#last-fetched").textContent = `Updated on ${getLastFetched(paramRegion)}`;

  for (const region in elementSelectRegion.options) {
    if (elementSelectRegion.options[region].value?.toLowerCase() === paramRegion) {
      elementSelectRegion.options[region].selected = true;
      break;
    }
  }

  if (notValid || !paramWorld) {
    elementSelectWorld.options[0].selected = true;
  } else {
    for (const world in elementSelectWorld.options) {
      if (elementSelectWorld.options[world].dataset?.id === paramWorld) {
        elementSelectWorld.options[world].selected = true;
        break;
      }
    }
  }

  if (!notValid && paramSearch) {
    elementSearchGuild.value = paramSearch;
  }

  if (prevState) {
    DEBUG && console.log("2) toURL() - search-guild-prev-dispatch");
    elementSearchGuild.dispatchEvent(new Event("search-prev"));
  } else {
    DEBUG && console.log("3) toURL() - search-guild-dispatch");
    elementSearchGuild.dispatchEvent(new Event("search"));
  }
}

function getReadableWorld(id, region) {
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

async function removeResults() {
  document.querySelector("#results")?.remove();
}

async function search(event) {
  DEBUG && console.log(`1) search() (${event})`);
  const promiseRemoveResults = removeResults();

  const query = event.target.value.toLowerCase();
  const elementSelectWorld = document.querySelector("#select-world");
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex].dataset.id;
  if ((!query && !worldId) || (query && query.length < 2)) {
    await promiseRemoveResults;
    return;
  }

  const elementSelectRegion = document.querySelector("#select-region");
  const region = elementSelectRegion.value.toLowerCase();

  const isGuildTag = /^\[/.test(query);
  const regex = new RegExp(`${isGuildTag ? "" : "\\b"}${query}`.replace("[", "\\[\\b").replace("]", "\\b\\]"));

  let result = [];
  if (query && !worldId) {
    result = Object.entries(LINKS[region]).reduce((accu, [world, guilds]) => {
      for (const guild of guilds) {
        if (query && !regex.test(`${guild.n} [${guild.t}]`.toLowerCase())) continue;
        accu.push({ ...guild, ...{ rw: getReadableWorld(world, region) } });
      }
      return accu;
    }, []);
  } else if (query && worldId) {
    result = LINKS[region][Number.parseInt(worldId, 10)].filter((guild) => regex.test(`${guild.n} [${guild.t}]`.toLowerCase()));
  } else if (!query && worldId) {
    result = LINKS[region][Number.parseInt(worldId, 10)];
  }

  const sortedResults = result.sort((a, b) => a.t.localeCompare(b.t));
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
  window.scrollTo(0, 0);
}

document.querySelector("#select-region").addEventListener("change", async (event) => {
  DEBUG && console.log(`1) select-region-listener (event: ${event})`);
  if (event.isTrusted) {
    const region = event.target.value.toLowerCase();
    if (!Object.hasOwn(LINKS, region)) {
      await loadLinks(region);
    }
    populateDropDown(region);
    document.querySelector("#last-fetched").textContent = `Updated on ${getLastFetched(region)}`;

    DEBUG && console.log("2) select-region-listener - select-world-dispatch");
    const selectWorld = document.querySelector("#select-world");
    selectWorld.dispatchEvent(new Event("change"));
  }
});

document.querySelector("#select-world").addEventListener("change", async () => {
  DEBUG && console.log("1) select-world-listener");

  DEBUG && console.log("2) select-world-listener - search-guild-dispatch");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSearchGuild.dispatchEvent(new Event("search"));
});

document.querySelector("#search-guild").addEventListener("search-prev", async (event) => {
  DEBUG && console.log(`1) search-guild-prev-listener (event: ${event})`);
  await search(event);
});

document.querySelector("#search-guild").addEventListener("search", async (event) => {
  DEBUG && console.log(`1) search-guild-listener (event: ${event})`);
  await setURL();
  await search(event);
});

function populateDropDown(region) {
  DEBUG && console.log(`1) populateDropdown() (region: ${region})`);
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
  DEBUG && console.log(`1) loadLinks() (region: ${region})`);
  const response = await fetch(JSONS[region]);
  const json = await response.json();
  LINKS[region] = json.worlds;
  LASTUPDATE[region] = json.lastModified;
}

async function Job() {
  DEBUG && console.log("1) Job()");
  toURL();
}

await Job();
