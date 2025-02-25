const axios = require("axios");
const fs = require("fs");

// Define the forum post URLs for each game jam
const GAMEJAM_URLS = {
    "gameJam1": "https://devforum.roblox.com/raw/3389448?page=",
    "gameJam2": "https://devforum.roblox.com/raw/3181924/?page=",
    "gameJam3": "https://devforum.roblox.com/raw/3104238/?page=",
    "gameJam4": "https://devforum.roblox.com/raw/2779970/?page=",
    "gameJam5": "https://devforum.roblox.com/raw/2468676/?page=",
    "gameJam6": "https://devforum.roblox.com/raw/2206650/?page=",
    "gameJam7": "https://devforum.roblox.com/raw/1677276/?page="
};

// Default info section (can be modified)
const defaultInfo = {
 "lastUpdated": new Date().toISOString(),
    "chalanceInfo": {
        "1": { // is again the recentst game jam
            "fullName": "Developer Chalange 2025",
            "shortName": "Developer 25",
            "Duration": "3 days",
            "Start": "07-02-2025 | 7 feb 2025 | 23:00 | 11 pm | 0",
            "End": "10-02-2025 | 10 feb 2025 | 23:00 | 11 pm | 0",
            "Description": "the developer chalange always is a weekend in february the time to show off your skills by making a game in one weekend",
            "Theme": "Break the system",
            "OGName": "dev25_ID7" // dont change this needed for tags and for the data store
        },
        "2": {
            "fullName": "Introducing Unite 2024",
            "shortName": "Unite 24",
            "Duration": "16 days",
            "Start": "11-10-2024 | 11 oct 2024 | 18:00 | 6 pm | 2",
            "End": "27-10-2024 | 27 oct 2024 | 18:00 | 6 pm| 1",
            "Description": "Unite 2024 offers an exciting opportunity to network, compete, and win amazing prizes! This challenge has a specific focus on Europe-based developer networking and collaboration, however anyone can participate, no matter where you are from! <br /> Source: dev forum",
            "Theme": "There is only one rule",
            "OGName": "un24_ID6" // dont change this needed for tags and for the data store

        },
        "3": { 
            "fullName": "Roblox Inspire 2024 Challenge",
            "shortName": "Inspire 24",
            "Duration": "3 days",
            "Start": "10-08-2024 | 10 aug 2024 | 10:00 | 10 am | -7",
            "End": "13-08-2024 | 13 aug 2024 | 10:00 | 10 am | -7",
            "Description": "inspire is an events with diferent work shops and a game jam at the end",
            "Theme": "Time is your enemy",
            "OGName": "coninsp24_ID5" // dont change this needed for tags and for the data store

        },
        "4": { 
            "fullName": "Roblox Developer Challenge 2024",
            "shortName": "Developer 24",
            "Duration": "2 days",
            "Start": "26-01-2024 | 26 jan 2024 | 15:00 | 3 pm | -8",
            "End": "28-01-2024 | 28 jan 2024 | 15:00 | 3 pm | -8",
            "Description": "a yearly development competition gathering the whole world to create the most amazing Roblox experiences based on a theme! <br /> Source: dev forum <br /><br /> mostly run a weekend in february the time to show off your skills and make a game in one weekend",
            "Theme": "Unexpected Development",
            "OGName": "dev24_ID4" // dont change this needed for tags and for the data store

        },
         "5": { 
            "fullName": "Connect 2023 Challenge",
            "shortName": "Connect 23",
            "Duration": "10 days",
            "Start": "28-07-2023 | 28 jul 2023 | 10:00 | 10 am | -7",
            "End": "07-08-2023 | 7 aug 2023 | 10:00 | 10 am | -7",
            "Description": "connect is an events with diferent work shops and a game jam at the end its called inspire now",
            "Theme": "Parallelism",
            "OGName": "coninsp23_ID3" // dont change this needed for tags and for the data store

        },
        "6": { 
            "fullName": "Roblox Developer Challenge 2023",
            "shortName": "Developer 23",
            "Duration": "3 days",
            "Start": "17-03-2023 | 17 mar 2023 | 10:00 | 10 am | -8",
            "End": "20-03-2023 | 20 mar 2023 | 10:00 | 10 am | -8",
            "Description": "Welcome to the Roblox Developer Challenge, a yearly development competition gathering the whole world to create the most amazing Roblox experiences based on a theme! <br /> Source: dev forum",
            "Theme": "Chain Reaction",
            "OGName": "dev23_ID2" // dont change this needed for tags and for the data store

        },
        "7": { 
            "fullName": "Roblox Developer Dream Jam 2022",
            "shortName": "Dream Jam 22",
            "Duration": "10 days",
            "Start": "n/a | read desccription | | |",
            "End": "n/a | read desccription | | |",
            "Description": "developers will have ten days to create an experience based on the theme, when it’s announced on March 4th, 2022. Remember, you do not have to spend the full 10 days working on this - take as much or as little time as you’d like! After, there will be a short period of two weeks to allow our judging panel to select the top ten experiences! At this point, a vote will open where everyone will have the chance to vote on their favorite experiences! <br /><br />After the community vote, the winning teams will have the opportunity to refine, update, and make ANY changes to their experiences that they deem necessary. These changes must be made AND published by April 12th at 11:59 PM PST. <br /><br />After another week of review by our panel of judges, the top three experiences will be announced! These will be the first, second, and third place winners of the Roblox Developer Dream Jam! <br /> Source: Dev forum | <br /><br />this a game jam with diferent rounds with semi finals etc",
            "Theme": "Your Dream Experience",
            "OGName": "dream22_ID1" // dont change this needed for tags and for the data store

        },
    },
    "TotalGameJams": 7
};

// Initialize the gameJamData object with the defaultInfo data
let gameJamData = { "info": defaultInfo };

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

// Function to scrape all pages for a game jam until an empty page is found
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

// Main function to fetch game data based on scraped universe IDs
async function fetchGameData() {
    let allGameData = [];

    try {
        for (let [gameJam, gameJamData] of Object.entries(gameJamData)) {
            if (gameJam !== "info") {
                const gameJamIDs = Object.values(gameJamData);

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
