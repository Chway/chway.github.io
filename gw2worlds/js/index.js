import search from "./search.js";
import * as utils from "./utils.js";
import * as writeDom from "./writeDom.js";

/*
TODO-------------
LESS listeners and dispatch, MORE functions ?
work on accessibility and compatiblity
tweak html/css
clean/refacto main code
more comments
do not show "Why is my guild.." with results? or make it much less visible, or the results much more visible?
add a "home" button
TODO-------------
*/

export const DEBUG = false;
export const JSONS = { eu: "linksEU.json", na: "linksNA.json" };
export const ALLWORLDS = [
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
export const LINKS = {};
export const LASTUPDATE = {};

window.onscroll = () => {
  const elementGoToTop = document.querySelector("#go-to-top");
  elementGoToTop.style.display = window.scrollY ? "block" : "none";
};

window.addEventListener("popstate", async (event) => {
  DEBUG && console.log(`1) window-listener-popstate (event: ${event})`);
  const hasParams = await toURL(event.state);
  if (!hasParams) writeDom.writeStats();
});

document.querySelector("#go-to-top").addEventListener("click", () => {
  DEBUG && console.log("1) go-to-top-listener-click");
  window.scrollTo(0, 0);
});

document.querySelector("#region").addEventListener("click", async (event) => {
  DEBUG && console.log(`1) region-listener-click (event: ${event})`);
  if (!event.target.matches("input[type='radio']")) return;

  const region = event.target.value;

  if (!Object.hasOwn(LINKS, region)) {
    await utils.loadLinks(region);
  }

  let promisePrefetch;
  if (!Object.hasOwn(LINKS, region === "eu" ? "na" : "eu")) {
    promisePrefetch = utils.loadLinks(region === "eu" ? "na" : "eu");
  }

  utils.populateDropDown(region);

  DEBUG && console.log("2) region-listener-change - search-guild-dispatch");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSearchGuild.dispatchEvent(new Event("search"));
  await promisePrefetch;
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

document.querySelector("#sort").addEventListener("click", async (event) => {
  DEBUG && console.log(`1) sort-listener-click (event: ${event})`);
  if (!event.target.matches("input[type='radio']")) return;
  localStorage.setItem("gw2worlds_sortby", event.target.value);
  DEBUG && console.log("2) sort-listener - search-guild-dispatch-prev");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSearchGuild.dispatchEvent(new Event("search-prev"));
});

document.querySelector("#search-guild").addEventListener("search", async (event) => {
  DEBUG && console.log(`1) search-guild-listener-search (event: ${event})`);
  await utils.setURL();
  await search(event);
});

document.querySelector("#search-guild").addEventListener("search-prev", async (event) => {
  DEBUG && console.log(`1) search-guild-listener-search-prev (event: ${event})`);
  await search(event);
});

document.querySelector("#clear").addEventListener("click", () => {
  DEBUG && console.log("1) clear-listener");
  const elementSelectWorld = document.querySelector("#select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  elementSelectWorld.options[0].selected = true;
  elementSearchGuild.value = "";
  DEBUG && console.log("2) clear-listener - search-guild-dispatch");
  elementSearchGuild.dispatchEvent(new Event("search"));
});

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

async function toURL(prevState) {
  DEBUG && console.log(`1) toURL() (prevState: ${Boolean(prevState)})`);
  const params = new URLSearchParams(window.location.search);
  let paramRegion = prevState ? prevState.region : (params.get("region") || "eu").toLowerCase();
  const paramWorld = prevState ? prevState.world : params.get("world");
  let paramSearch = prevState ? prevState.search : params.get("search");
  const elementSelectWorld = document.querySelector("#select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  if (prevState && !prevState.search) paramSearch = "";
  const notValid = (paramRegion !== "eu" && paramRegion !== "na") || (paramWorld && !utils.getReadableWorld(paramWorld, paramRegion));
  if (paramRegion !== "eu" && paramRegion !== "na") paramRegion = "eu";

  const localSortBy = localStorage.getItem("gw2worlds_sortby");
  utils.setSorting(localSortBy);

  if (!Object.hasOwn(LINKS, paramRegion)) {
    await utils.loadLinks(paramRegion);
  }

  let promisePrefetch;
  if (!Object.hasOwn(LINKS, paramRegion === "eu" ? "na" : "eu")) {
    promisePrefetch = utils.loadLinks(paramRegion === "eu" ? "na" : "eu");
  }

  utils.setRegion(paramRegion);
  utils.populateDropDown(paramRegion);

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
    await utils.removeResults();
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

  await promisePrefetch;
  return params.size;
}

async function Job() {
  DEBUG && console.log("1) Job()");
  const hasParams = await toURL();
  if (!hasParams) writeDom.writeStats();
}

await Job();
