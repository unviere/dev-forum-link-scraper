const axios = require("axios");
const fs = require("fs");

// Default info section (can be modified)
const defaultInfo = {
  "lastUpdated": new Date().toISOString(),
  "chalanceInfo": {
    "1": { // Example game jam 1
      "fullName": "Developer Chalange 2025",
      "shortName": "Developer 25",
      "Duration": "3 days",
      "Start": "07-02-2025 | 7 feb 2025 | 23:00 | 11 pm | 0",
      "End": "10-02-2025 | 10 feb 2025 | 23:00 | 11 pm | 0",
      "Description": "the developer chalange always is a weekend in february the time to show off your skills by making a game in one weekend",
      "Theme": "Break the system",
      "OGName": "dev25_ID7" // Don't change
    },
    // Other game jams can be added here
  },
  "TotalGameJams": 1
};

let gameJamData = { "info": defaultInfo };

// Define the forum post URLs for each game jam
const GAMEJAM_URLS = {
  "gameJam1": "https://devforum.roblox.com/raw/3389448?page="
  //"gameJam2": "https://devforum.roblox.com/raw/3181924/?page=",
  //"gameJam3": "https://devforum.roblox.com/raw/3104238/?page=",
  //"gameJam4": "https://devforum.roblox.com/raw/2779970/?page=",
 // "gameJam5": "https://devforum.roblox.com/raw/2468676/?page=",
 // "gameJam6": "https://devforum.roblox.com/raw/2206650/?page=",
 // "gameJam7": "https://devforum.roblox.com/raw/1677276/?page="
};

// Roblox API Endpoints
const GetUniverseApi = "https://apis.roproxy.com/universes/v1/places/";
const GetGameDataApi = "https://games.roproxy.com/v1/games?universeIds=";
const maxUniverseCalls = 50;
let index = 0;
const UniverseDelay = 2000; // In milliseconds

let duplicated = 0;
let info = {
  duplicated: [],
};

// Function to scrape content from a specific page
async function scrapePage(url) {
  try {
    const { data } = await axios.get(url);
    console.log(`Scraping ${url}...`);

    if (!data || data.trim() === "") {
      console.log(`Page ${url} is empty.`);
      return null; // Page is completely blank
    }

    // Extract game IDs from URLs
    const regex = /https:\/\/www\.roblox\.com\/games\/(\d+)/g;
    let matches;
    let ids = new Set(); // Store unique IDs

    while ((matches = regex.exec(data)) !== null) {
      ids.add(matches[1]); // Extracted game ID
    }

    return Array.from(ids);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

// Function to scrape all pages for a game jam
async function scrapeGameJam(gameJamKey, baseURL) {
  let page = 1;
  let foundLinks = new Set();

  while (true) {
    let url = baseURL + page;
    let ids = await scrapePage(url);

    if (ids === null) {
      console.log(`Page ${page} for ${gameJamKey} is empty. Stopping.`);
      break; // Stop if we get an empty page
    }

    // Add unique IDs
    ids.forEach(id => foundLinks.add(id));
    page++; // Move to the next page
  }

  // Save structured data if IDs were found
  if (foundLinks.size > 0) {
    let formattedData = {};
    let index = 1;

    foundLinks.forEach(id => {
      formattedData[index] = id;
      index++;
    });

    // Update the gameJamData object with the new data for the game jam
    gameJamData[gameJamKey] = formattedData;
    console.log(`Scraped ${foundLinks.size} unique game IDs for ${gameJamKey}.`);
  } else {
    console.log(`No valid game links found for ${gameJamKey}.`);
  }
}

// Function to get Universe ID
async function getUniverseID(placeID) {
  try {
    const response = await axios.get(GetUniverseApi + placeID + "/universe");
    return response.data.universeId;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 429) {
        console.warn("Rate limited. Please wait a moment.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getUniverseID(placeID);
      } else if (error.response.status === 502) {
        console.warn("Timeout error. Retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getUniverseID(placeID);
      } else {
        console.warn("Failed to retrieve Universe ID for place:", placeID, error.response.status);
      }
    }
  }
}

// Function to get Game Data
async function getGameData(universeID) {
  try {
    const response = await axios.get(GetGameDataApi + universeID);
    return response.data.data[0];
  } catch (error) {
    if (error.response) {
      if (error.response.status === 429) {
        console.warn("Rate limited. Please wait a moment.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getGameData(universeID);
      } else if (error.response.status === 502) {
        console.warn("Timeout error. Retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getGameData(universeID);
      } else {
        console.warn("Failed to retrieve game data for universe:", universeID, error.response.status);
      }
    }
  }
}

// Function to fetch game data
async function fetchGameData() {
  let allGameData = [];

  try {
    for (let [gameJam, gameJamDetails] of Object.entries(gameJamData)) {
      if (gameJam !== "info") {
        const gameJamIDs = Object.values(gameJamDetails);

        for (let i = 0; i < gameJamIDs.length; i++) {
          index++;
          if (index >= maxUniverseCalls) {
            console.warn("Max API calls reached. Waiting...");
            await new Promise(resolve => setTimeout(resolve, UniverseDelay));
            index = 0;
          }

          const placeID = gameJamIDs[i];
          const universeID = await getUniverseID(placeID);
          if (!universeID) continue;

          const universeIDString = universeID.toString();
          console.log("Universe ID:", universeID);

          // Avoid duplicates
          const duplicate = allGameData.some(game => game.universeID === universeID);
          if (!duplicate) {
            const gameInfo = await getGameData(universeID);
            if (gameInfo) {
              const newGame = { 
                title: gameInfo.sourceName, 
                description: gameInfo.sourceDescription, 
                placeID: placeID,
                universeID: universeID, 
                stats: {
                  TPlay: gameInfo.playing,
                  TVisits: gameInfo.visits,
                },
                attributes: {
                  Created: gameInfo.created,
                  Updated: gameInfo.updated,
                  Genre: gameInfo.genre,
                  GenreNew: gameInfo.genre_l1,
                  SubGenreNew: gameInfo.genre_l2,
                  MaxPlayers: gameInfo.maxPlayers,
                },
              };

              allGameData.push(newGame);
              console.log("New game added:", newGame);
            } else {
              console.warn("Game has been removed from Roblox. Skipping.");
            }
          } else {
            console.warn("Game is duplicated.");
            duplicated++;
          }
        }
      }
    }

    // Save all collected game data to JSON
    fs.writeFileSync("game_data.json", JSON.stringify(allGameData, null, 2));
    console.log("Saved all data to game_data.json");

  } catch (error) {
    console.error("Failed to retrieve data:", error);
  }
}

// Main function to run both the scraper and the game data fetcher
async function runScraperAndFetcher() {
  // Ensure scraping happens first
  for (let [gameJam, url] of Object.entries(GAMEJAM_URLS)) {
    await scrapeGameJam(gameJam, url);
  }

  // Fetch game data after scraping
  await fetchGameData();
}

// Run the scraper and data fetcher
runScraperAndFetcher();
