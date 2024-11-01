import { DEBUG, LINKS } from "./index.js";
import * as utils from "./utils.js";

export function writeStats() {
  DEBUG && console.log("1) writeStatsToDom()");
  const region = utils.getRegion().value;

  const templateStats = document.querySelector("#template-stats");
  const cloneStats = templateStats.content.cloneNode(true);
  const divStats = cloneStats.querySelector("#stats");
  const spanStatsRegionCount = divStats.querySelector("#stats-region-count");
  const spanStatsRegion = divStats.querySelector("#stats-region");
  const spanStatsLeastWorlds = divStats.querySelector("#stats-least-worlds");
  const spanStatsLeastWorldCondi = divStats.querySelector("#stats-least-world-condi");
  const spanStatsLeastWorldCount = divStats.querySelector("#stats-least-world-count");
  const spanStatsHighestWorlds = divStats.querySelector("#stats-highest-worlds");
  const spanStatsHighestWorldCondi = divStats.querySelector("#stats-highest-world-condi");
  const spanStatsHighestCount = divStats.querySelector("#stats-highest-world-count");
  const spanLastFetched = divStats.querySelector("#last-fetched");
  spanLastFetched.textContent = `Last updated on ${utils.getLastFetched(region)}.`;
  const stats = { regionCount: 0, region: region, leastWorldCount: 0, leastWorld: [], highestWorldCount: 0, highestWorld: [] };

  for (const [worldId, guilds] of Object.entries(LINKS[region])) {
    stats.regionCount = stats.regionCount + guilds.length;
    const readableWorld = utils.getReadableWorld(worldId, region);

    if (guilds.length === stats.leastWorldCount) {
      stats.leastWorld.push({ name: readableWorld, id: worldId });
    } else if (guilds.length === stats.highestWorldCount) {
      stats.highestWorld.push({ name: readableWorld, id: worldId });
    } else if (stats.leastWorldCount === 0 || guilds.length < stats.leastWorldCount) {
      stats.leastWorldCount = guilds.length;
      stats.leastWorld = [{ name: readableWorld, id: worldId }];
    } else if (stats.highestWorldCount === 0 || guilds.length > stats.highestWorldCount) {
      stats.highestWorldCount = guilds.length;
      stats.highestWorld = [{ name: readableWorld, id: worldId }];
    }
  }

  spanStatsRegionCount.textContent = stats.regionCount.toLocaleString();
  spanStatsRegion.textContent = stats.region === "eu" ? "European" : "North American";
  spanStatsLeastWorldCondi.textContent = stats.leastWorld.length > 1 ? "worlds are" : "world is";
  spanStatsLeastWorldCount.textContent = stats.leastWorldCount.toLocaleString();
  spanStatsHighestWorldCondi.textContent = stats.leastWorld.length > 1 ? "worlds are" : "world is";
  spanStatsHighestCount.textContent = stats.highestWorldCount.toLocaleString();

  const objLessHigh = [
    { element: spanStatsLeastWorlds, arr: stats.leastWorld },
    { element: spanStatsHighestWorlds, arr: stats.highestWorld },
  ];

  for (const type of objLessHigh) {
    for (const i in type.arr) {
      const span = document.createElement("span");
      span.textContent = type.arr[i].name;

      span.addEventListener("click", () => {
        const selectWorld = document.querySelector("#select-world");
        const searchGuild = document.querySelector("#search-guild");
        for (const x in selectWorld.options) {
          if (selectWorld.options[x].value === type.arr[i].name) {
            selectWorld.options[x].selected = true;
            searchGuild.dispatchEvent(new Event("search"));
            break;
          }
        }
      });

      type.element.appendChild(span);

      if (i < type.arr.length - 1) {
        const nextStr = i < type.arr.length - 2 ? ",\x20" : ",\x20and\x20";
        type.element.appendChild(nextStr);
      }
    }
  }

  document.querySelector("#container").appendChild(divStats);
  window.scrollTo(0, 0);
}

export function writeResults(isNext, loadAll, sortedResults, worldId, query) {
  DEBUG && console.log(`1) writeToDom() (isNext: ${isNext}, loadAll: ${loadAll}, sortedResults: ${typeof sortedResults}, worldId: ${worldId}, query: ${query})`);
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
    spanResultQuery.textContent = query ? query : utils.getReadableWorld(worldId);

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
    const spanName = clone.querySelector(".result-name");
    const spanTag = clone.querySelector(".result-tag");
    const spanWorld = clone.querySelector(".result-world");
    spanName.textContent = `${guild.n}`;
    spanTag.textContent = `[${guild.t}]`;

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
      writeResults(true, true, sortedResults, worldId);
    });

    spanResultCount.textContent = sortedResults.length;
    elementResults.appendChild(clone);
  }

  document.querySelector("#container").appendChild(elementResults);
  if (!isNext) window.scrollTo(0, 0);
}
