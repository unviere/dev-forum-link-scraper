const axios = require("axios");
const fs = require("fs");

// Define the forum post URLs for each game jam
const GAMEJAM_URLS = {
    "gameJam1": "https://devforum.roblox.com/raw/3389448?page=", // game jam 1 is not game jam 1 we use it to store the recentst game jam
    "gameJam2": "https://devforum.roblox.com/raw/1677276/?page=", // this than the first
    "gameJam3": "https://devforum.roblox.com/raw/2206650/?page=",
    "gameJam4": "https://devforum.roblox.com/raw/2468676/?page="
};

// Default info section (can be modified)
const defaultInfo = {
    "lastUpdated": new Date().toISOString(),
    "chalanceNames": {
        "1": { // is again the recentst game jam
            "fullName": "Developer Chalange 2025",
            "shortName": "Developer 25"
        },
        "2": { // this the first game jam
            "fullName": "Roblox Developer Dream Jam 2022",
            "shortName": "Dream Jam 22"
        },
        "3": { // this the first game jam
            "fullName": "Roblox Developer Challenge 2023",
            "shortName": "Developer 23"
        },
         "4": { // this the first game jam
            "fullName": "Connect 2023 Challenge",
            "shortName": "Connect 23"
        }
    },
    "TotalGameJams": 4
};

// Stores final data
let gameJamData = { "info": defaultInfo };

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

        gameJamData[gameJamKey] = formattedData;
        console.log(`Scraped ${foundLinks.size} unique game IDs for ${gameJamKey}.`);
    } else {
        console.log(`No valid game links found for ${gameJamKey}.`);
    }
}

// Main function to handle all game jams
async function runScraper() {
    for (let [gameJam, url] of Object.entries(GAMEJAM_URLS)) {
        await scrapeGameJam(gameJam, url);
    }

    // Save all collected data to JSON
    fs.writeFileSync("universe_data.json", JSON.stringify(gameJamData, null, 2));
    console.log("Saved all data to universe_data.json");
}

// Run the scraper
runScraper();
