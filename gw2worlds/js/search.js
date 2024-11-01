import { DEBUG, LINKS } from "./index.js";
import * as utils from "./utils.js";
import * as writeDom from "./writeDom.js";

export default async function search(event) {
  DEBUG && console.log(`1) search() (${event})`);
  const promiseRemoveResults = utils.removeResults();

  const elementSelectWorld = document.querySelector("#select-world");
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex]?.dataset.id;

  if (!event.target.value && !worldId) {
    await promiseRemoveResults;
    writeDom.writeStats();
    return;
  }

  if (event.target.value && event.target.value.length < 2) {
    await promiseRemoveResults;
    writeDom.writeResults(false, Boolean(event.target.value), [], worldId, event.target.value);
    return;
  }

  const query = event.target.value.toLowerCase().replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  const region = utils.getRegion().value;
  const sortBy = localStorage.getItem("gw2worlds_sortby");
  const regex = new RegExp(`(?:(?:^|\\s)${query}s?(?:$|\\s)|(?:^|\\s|\\[)${query}(?:$|\\s|\\]))`, "i");

  let result = [];
  if (query && !worldId) {
    result = Object.entries(LINKS[region]).reduce((accu, [world, guilds]) => {
      for (const guild of guilds) {
        if (query && !regex.test(`${guild.n} [${guild.t}]`)) continue;
        accu.push({ ...guild, ...{ rw: utils.getReadableWorld(world, region) } });
      }
      return accu;
    }, []);
  } else if (query && worldId) {
    result = LINKS[region][Number.parseInt(worldId, 10)].filter((guild) => regex.test(`${guild.n} [${guild.t}]`));
  } else if (!query && worldId) {
    result = LINKS[region][Number.parseInt(worldId, 10)];
  }

  const sortedResults = sortBy === "name" ? result.sort((a, b) => a.n.trim().localeCompare(b.n.trim())) : result.sort((a, b) => a.t.localeCompare(b.t));
  writeDom.writeResults(false, Boolean(query), sortedResults, worldId, event.target.value);
  await promiseRemoveResults;
}
