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

function getReadableWorld(id) {
  for (const w of allWorlds) {
    if (Number.parseInt(id, 10) === w.id) {
      return w.en;
    }
  }
}

document.querySelector("#search-guild").addEventListener("search", (event) => {
  console.log("search");
  event.target.classList.remove("wrong-query");
  const query = event.target.value.toLowerCase();
  const elementSelectRegion = document.querySelector("#select-region");
  const region = elementSelectRegion.value.toLowerCase();
  const elementSelectWorld = document.querySelector("#select-world");
  const worldId = elementSelectWorld.options[elementSelectWorld.selectedIndex].dataset.id;

  if (query.length === 0 && !worldId) {
    const elementResults = document.querySelectorAll(".result");
    for (const element of elementResults) element.remove();
    document.querySelector("#counter").textContent = "";
    return;
  }

  if (query.length === 0 && worldId) {
    elementSelectWorld.dispatchEvent(new Event("change"));
    return;
  }

  if (query && query.length >= 2) {
    const elementResults = document.querySelectorAll(".result");
    for (const element of elementResults) element.remove();

    const isGuildTag = /^\[/.test(query);
    const regex = new RegExp(`${isGuildTag ? "" : "\\b"}${query}`.replace("[", "\\[\\b").replace("]", "\\b\\]"));
    const results = [];

    if (worldId) {
      for (const guild of links[region][Number.parseInt(worldId, 10)]) {
        if (regex.test(guild.toLowerCase())) {
          results.push({ name: guild, world: "" });
        }
      }
    } else {
      for (const [world, guilds] of Object.entries(links[region])) {
        const readableWorld = getReadableWorld(world);
        for (const guild of guilds) {
          if (regex.test(guild.toLowerCase())) {
            results.push({ name: guild, world: readableWorld });
          }
        }
      }
    }

    const arrNameTag = results.reduce((accu, value) => {
      const matches = value.name.match(/(.+)\s\[(.+)\]/);
      const nameTag = { name: matches[1], tag: matches[2] };
      accu.push({ ...nameTag, ...{ world: value.world } });
      return accu;
    }, []);
    const sortedNameTag = arrNameTag.sort((a, b) => a.tag.localeCompare(b.tag));

    for (const guild of sortedNameTag) {
      const p = document.createElement("div");
      p.classList.add("result");
      const spanName = document.createElement("span");
      spanName.classList.add("result-name");
      const spanTag = document.createElement("span");
      spanTag.classList.add("result-tag");
      const spanWorld = document.createElement("span");
      spanWorld.classList.add("result-world");
      spanName.textContent = `${guild.name}`;
      spanWorld.textContent = `[${guild.world}]`;
      spanWorld.addEventListener("mouseup", () => {
        for (const world in elementSelectWorld.options) {
          if (elementSelectWorld.options[world].value === guild.world) {
            event.target.value = "";
            elementSelectWorld.options[world].selected = true;
            elementSelectWorld.dispatchEvent(new Event("change"));
            return;
          }
        }
      });
      spanTag.textContent = `[${guild.tag}]`;
      p.appendChild(spanName);
      p.appendChild(spanTag);
      if (!worldId) p.appendChild(spanWorld);
      document.querySelector("#results").appendChild(p);
      document.querySelector("#counter").textContent = `(${sortedNameTag.length} guild${sortedNameTag.length > 1 ? "s" : ""})`;
    }
    window.scrollTo(0, 0);
  } else {
    event.target.classList.add("wrong-query");
  }
});

document.querySelector("#select-region").addEventListener("change", () => {
  populateDropDown();
  const selectWorld = document.querySelector("#select-world");
  selectWorld.dispatchEvent(new Event("change"));
});

document.querySelector("#select-world").addEventListener("change", (event) => {
  console.log("select-world");
  const elementSearchGuild = document.querySelector("#search-guild");
  const id = event.target.options[event.target.selectedIndex].dataset.id;

  const elementResults = document.querySelectorAll("#results .result");
  for (const result of elementResults) result.remove();

  if (!id && !elementSearchGuild.value) {
    document.querySelector("#counter").textContent = "";
    return;
  }

  if (elementSearchGuild.value) {
    elementSearchGuild.dispatchEvent(new Event("search"));
    return;
  }

  const selectRegion = document.querySelector("#select-region");
  const region = selectRegion.value.toLowerCase();

  const arrNameTag = links[region][Number.parseInt(id, 10)].reduce((accu, value) => {
    const matches = value.match(/(.+)\s\[(.+)\]/);
    const nameTag = { name: matches[1], tag: matches[2] };
    accu.push(nameTag);
    return accu;
  }, []);
  const sortedNameTag = arrNameTag.sort((a, b) => a.tag.localeCompare(b.tag));

  for (const guild of sortedNameTag) {
    const p = document.createElement("div");
    p.classList.add("result");
    const spanName = document.createElement("span");
    spanName.classList.add("result-name");
    const spanTag = document.createElement("span");
    spanTag.classList.add("result-tag");
    spanName.textContent = `${guild.name}`;
    spanTag.textContent = `[${guild.tag}]`;
    p.appendChild(spanName);
    p.appendChild(spanTag);
    document.querySelector("#results").appendChild(p);
  }
  document.querySelector("#counter").textContent = `(${sortedNameTag.length} guild${sortedNameTag.length > 1 ? "s" : ""})`;
  window.scrollTo(0, 0);
});

function populateDropDown() {
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
  const promises = [fetch(jsons.eu).then((response) => response.json()), fetch(jsons.na).then((response) => response.json())];
  [links.eu, links.na] = await Promise.all(promises);
  populateDropDown();
}

await Job();
