/*
-------------TODO-------------
CURRENT unnecessary ?
LESS listeners and dispatch, MORE functions ?
change title, GW2Worlds should be at the end ?
-------------TODO-------------
*/

const DEBUG = false;
const JSONS = { eu: "linksEU.json", na: "linksNA.json" };
const CURRENT = {};
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

window.onscroll = () => {
  const elementGoToTop = document.querySelector("#go-to-top");
  elementGoToTop.style.display = window.scrollY ? "block" : "none";
};

window.addEventListener("popstate", async (event) => {
  DEBUG && console.log(`1) window-listener-popstate (event: ${event})`);
  await toURL(event.state);
});

document.querySelector("#go-to-top").addEventListener("click", () => {
  DEBUG && console.log("1) go-to-top-listener-click");
  window.scrollTo(0, 0);
});

document.querySelector("#select-region").addEventListener("change", async (event) => {
  DEBUG && console.log(`1) select-region-listener-change (event: ${event})`);

  const region = event.target.value.toLowerCase();
  if (!Object.hasOwn(LINKS, region)) {
    await loadLinks(region);
  }
  populateDropDown(region);
  document.querySelector("#last-fetched").textContent = `Updated on ${getLastFetched(region)}`;

  DEBUG && console.log("2) select-region-listener-change - search-guild-dispatch");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSearchGuild.dispatchEvent(new Event("search"));
});

document.querySelector("#select-region").addEventListener("wheel", (event) => {
  DEBUG && console.log("1) select-region-listener-wheel");
  event.preventDefault();
  handlerSelectScroll(event);
});

document.querySelector("#select-world").addEventListener("change", () => {
  DEBUG && console.log("1) select-world-listener-change");
  DEBUG && console.log("2) select-world-listener - search-guild-dispatch");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSearchGuild.dispatchEvent(new Event("search"));
});

document.querySelector("#select-world").addEventListener("wheel", (event) => {
  DEBUG && console.log("1) select-world-listener-wheel");
  event.preventDefault();
  handlerSelectScroll(event);
});

document.querySelector("#select-sort").addEventListener("change", (event) => {
  DEBUG && console.log("1) select-sort-listener-change");
  localStorage.setItem("gw2worlds_sortby", event.target.options[event.target.selectedIndex].value.toLowerCase());
  DEBUG && console.log("2) select-sort-listener - search-guild-dispatch-prev");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSearchGuild.dispatchEvent(new Event("search-prev"));
});

document.querySelector("#select-sort").addEventListener("wheel", (event) => {
  DEBUG && console.log("1) select-sort-listener-wheel");
  event.preventDefault();
  handlerSelectScroll(event);
});

document.querySelector("#search-guild").addEventListener("search", async (event) => {
  DEBUG && console.log(`1) search-guild-listener-search (event: ${event})`);
  await setURL();
  await search(event);
});

document.querySelector("#search-guild").addEventListener("search-prev", async (event) => {
  DEBUG && console.log(`1) search-guild-listener-search-prev (event: ${event})`);
  await search(event);
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

  const localSortBy = localStorage.getItem("gw2worlds_sortby");
  const elementSelectSort = document.querySelector("#select-sort");
  const sortBy = localSortBy ? localSortBy : "name";
  if (!localSortBy) localStorage.setItem("gw2worlds_sortby", "name");
  for (const option in elementSelectSort.options) {
    if (elementSelectSort.options[option].value?.toLowerCase() === sortBy) {
      elementSelectSort.options[option].selected = true;
      break;
    }
  }

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

  if (!paramSearch) {
    elementSearchGuild.value = "";
  }

  if (!params.size) {
    await removeResults();
    elementSearchGuild.value = "";
    return;
  }

  if (prevState) {
    elementSearchGuild.blur();

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
  document.querySelector("#stats")?.remove();
}

function writeToDom(isNext, loadAll, sortedResults, worldId, query) {
  DEBUG && console.log(`1) writeToDom() (${isNext}, ${loadAll}, ${typeof sortedResults}, ${worldId})`);
  document.querySelector("#load-all")?.remove();

  let elementResults;
  let cloneResultLegendNothing;
  if (isNext) {
    elementResults = document.querySelector("#results");
  } else {
    const templateResults = document.querySelector("#template-results");
    const cloneResults = templateResults.content.cloneNode(true);
    elementResults = cloneResults.querySelector("#results");

    const templateResultLegend = document.querySelector("#template-results-legend");
    const cloneResultsLegend = templateResultLegend.content.cloneNode(true);
    const divResultLegend = cloneResultsLegend.querySelector("#result-legend");
    const spanResultCount = cloneResultsLegend.querySelector("#result-legend-count");
    const spanResultQuery = cloneResultsLegend.querySelector("#result-legend-query");
    spanResultCount.textContent = `${sortedResults.length ? `${sortedResults.length} guild${sortedResults.length > 1 ? "s" : ""}` : "Nothing"}`;
    spanResultQuery.textContent = query ? query : getReadableWorld(worldId);

    if (query && query.length < 2) {
      const templateResultLegendFail = document.querySelector("#template-results-legend-fail");
      const cloneResultLegendFail = templateResultLegendFail.content.cloneNode(true);
      const spanResultLegendFail = cloneResultLegendFail.querySelector("#result-legend-fail");
      spanResultLegendFail.textContent = "Your query must contain atleast 2 characters.";
      divResultLegend.appendChild(spanResultLegendFail);
    }

    elementResults.appendChild(cloneResultsLegend);
  }

  if (isNext || (query && query.length >= 2)) {
    const templateResultLegendNothing = document.querySelector("#template-results-legend-nothing");
    cloneResultLegendNothing = templateResultLegendNothing.content.cloneNode(true);
  }

  const fragment = new DocumentFragment();
  const templateResult = document.querySelector("#template-result");
  for (const guild of sortedResults.slice(isNext ? 250 : 0, loadAll ? sortedResults.length : 250)) {
    const clone = templateResult.content.cloneNode(true);
    const divResult = clone.querySelector(".result");
    const spanTag = clone.querySelector(".result-tag");
    const spanWorld = clone.querySelector(".result-world");
    divResult.textContent = `${guild.n}`;
    spanTag.textContent = `[${guild.t}]`;
    divResult.appendChild(spanTag);

    if (!worldId) {
      spanWorld.textContent = guild.rw;
      spanWorld.addEventListener("click", (event) => {
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
      divResult.appendChild(spanWorld);
    } else {
      spanWorld.remove();
    }
    fragment.append(clone);
  }

  elementResults.appendChild(fragment);
  if (cloneResultLegendNothing) elementResults.appendChild(cloneResultLegendNothing);

  if (!loadAll && sortedResults.length > 30) {
    const templateResultLoadAll = document.querySelector("#template-result-load-all");
    const clone = templateResultLoadAll.content.cloneNode(true);
    const spanLoadAllLink = clone.querySelector("#load-all-link");
    const spanResultCount = clone.querySelector("#result-count");

    spanLoadAllLink.addEventListener("click", () => {
      writeToDom(true, true, CURRENT.sortedResults, CURRENT.worldId);
    });

    spanResultCount.textContent = sortedResults.length;
    elementResults.appendChild(clone);
  }

  document.querySelector("body").appendChild(elementResults);
  if (!isNext) window.scrollTo(0, 0);
}

function writeStatsToDom() {
  const elementSelectRegion = document.querySelector("#select-region");
  const region = elementSelectRegion.options[elementSelectRegion.selectedIndex].value.toLowerCase();

  const templateStats = document.querySelector("#template-stats");
  const cloneStats = templateStats.content.cloneNode(true);
  const divStats = cloneStats.querySelector("#stats");
  const spanStatsRegionCount = divStats.querySelector("#stats-region-count");
  const spanStatsRegion = divStats.querySelector("#stats-region");
  const spanStatsLeastWorld = divStats.querySelector("#stats-least-world");
  const spanStatsLeastWorldCondi = divStats.querySelector("#stats-least-world-condi");
  const spanStatsLeastWorldCount = divStats.querySelector("#stats-least-world-count");
  const spanStatsHighestWorld = divStats.querySelector("#stats-highest-world");
  const spanStatsHighestWorldCondi = divStats.querySelector("#stats-highest-world-condi");
  const spanStatsHighestCount = divStats.querySelector("#stats-highest-world-count");

  const stats = { regionCount: 0, region: region, leastWorldCount: 0, leastWorld: [], highestWorldCount: 0, highestWorld: [] };
  for (const [worldId, guilds] of Object.entries(LINKS[region])) {
    stats.regionCount = stats.regionCount + guilds.length;
    if (stats.leastWorldCount === 0 || guilds.length === stats.leastWorldCount) {
      stats.leastWorldCount = guilds.length;
      stats.leastWorld.push(getReadableWorld(worldId, region));
    } else if (stats.highestWorldCount === 0 || guilds.length === stats.highestWorldCount) {
      stats.highestWorldCount = guilds.length;
      stats.highestWorld.push(getReadableWorld(worldId, region));
    } else if (stats.leastWorldCount === 0 || guilds.length < stats.leastWorldCount) {
      stats.leastWorldCount = guilds.length;
      stats.leastWorld = [getReadableWorld(worldId, region)];
    } else if (stats.highestWorldCount === 0 || guilds.length > stats.highestWorldCount) {
      stats.highestWorldCount = guilds.length;
      stats.highestWorld = [getReadableWorld(worldId, region)];
    }
  }

  spanStatsRegionCount.textContent = stats.regionCount.toLocaleString();
  spanStatsRegion.textContent = stats.region === "eu" ? "European" : "North American";
  spanStatsLeastWorld.textContent = new Intl.ListFormat().format(stats.leastWorld);
  spanStatsLeastWorldCondi.textContent = stats.leastWorld.length > 1 ? "worlds are" : "world is";
  spanStatsLeastWorldCount.textContent = stats.leastWorldCount.toLocaleString();
  spanStatsHighestWorld.textContent = new Intl.ListFormat().format(stats.highestWorld);
  spanStatsHighestWorldCondi.textContent = stats.leastWorld.length > 1 ? "worlds are" : "world is";
  spanStatsHighestCount.textContent = stats.highestWorldCount.toLocaleString();
  document.querySelector("body").appendChild(divStats);
  window.scrollTo(0, 0);
}

async function search(event) {
  DEBUG && console.log(`1) search() (${event})`);
  const promiseRemoveResults = removeResults();

  const elementSelectWorld = document.querySelector("#select-world");
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex]?.dataset.id;

  if (!event.target.value && !worldId) {
    await promiseRemoveResults;
    writeStatsToDom();
    return;
  }

  if (event.target.value && event.target.value.length < 2) {
    await promiseRemoveResults;
    writeToDom(false, Boolean(event.target.value), [], worldId, event.target.value);
    return;
  }

  const query = event.target.value.toLowerCase().replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  const elementSelectRegion = document.querySelector("#select-region");
  const region = elementSelectRegion.value.toLowerCase();
  const sortBy = localStorage.getItem("gw2worlds_sortby");
  const regex = new RegExp(`(?:(?:^|\\s)${query}s?(?:$|\\s)|(?:^|\\s|\\[)${query}(?:$|\\s|\\]))`, "i");

  let result = [];
  if (query && !worldId) {
    result = Object.entries(LINKS[region]).reduce((accu, [world, guilds]) => {
      for (const guild of guilds) {
        if (query && !regex.test(`${guild.n} [${guild.t}]`)) continue;
        accu.push({ ...guild, ...{ rw: getReadableWorld(world, region) } });
      }
      return accu;
    }, []);
  } else if (query && worldId) {
    result = LINKS[region][Number.parseInt(worldId, 10)].filter((guild) => regex.test(`${guild.n} [${guild.t}]`));
  } else if (!query && worldId) {
    result = LINKS[region][Number.parseInt(worldId, 10)];
  }

  const sortedResults = sortBy === "name" ? result.sort((a, b) => a.n.trim().localeCompare(b.n.trim())) : result.sort((a, b) => a.t.localeCompare(b.t));
  CURRENT.sortedResults = sortedResults;
  CURRENT.worldId = worldId;

  writeToDom(false, Boolean(query), sortedResults, worldId, event.target.value);
  await promiseRemoveResults;
}

function handlerSelectScroll(event) {
  DEBUG && console.log("1) handlerSelectScroll()");
  // -100: scroll up , 100 : scroll down
  let nextSelected;
  if (event.deltaY > 0) {
    nextSelected = Math.min(event.target.selectedIndex + 1, event.target.options.length - 1);
  } else {
    nextSelected = Math.max(event.target.selectedIndex - 1, 0);
  }

  if (event.target.selectedIndex !== nextSelected) {
    event.target.selectedIndex = nextSelected;
    event.target.dispatchEvent(new Event("change"));
  }
}

function populateDropDown(region) {
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
