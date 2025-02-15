const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// DevForum URL to scrape
const DEVFORUM_URL = "https://devforum.roblox.com/t/roblox-developer-challenge-2025/3389448";
const MATCH_DOMAIN = "roblox.com/games/";
const ROBLOX_API = "https://games.roblox.com/v1/games?universeIds=";

// Scrape DevForum for relevant links
async function scrapeLinks() {
    try {
        const { data } = await axios.get(DEVFORUM_URL);
        const $ = cheerio.load(data);

        let links = new Set(); // Store unique links

        $("a").each((_, element) => {
            let href = $(element).attr("href");
            if (href && href.includes(MATCH_DOMAIN)) {
                console.log("Found matching link:", href);  // Debugging: log the matched links
                links.add(href);
            }
        });

        console.log(`Found ${links.size} matching links.`);
        return Array.from(links);
    } catch (error) {
        console.error("Error scraping DevForum:", error);
        return [];
    }
}

// Extract Place ID from a URL
function extractPlaceId(url) {
    let match = url.match(/(\d+)/);
    return match ? match[0] : null;
}

// Get Universe ID using Place ID
async function getUniverseId(placeId) {
    try {
        console.log(`Fetching Universe ID for Place ID: ${placeId}`);  // Debugging: log the Place ID being fetched
        const response = await axios.get(ROBLOX_API + placeId);
        const data = response.data;

        console.log(`API response for Place ID ${placeId}:`, data);  // Debugging: log the API response

        if (data.data && data.data.length > 0) {
            const universeId = data.data[0].rootPlaceId;
            console.log(`Found Universe ID: ${universeId}`);
            return universeId;
        } else {
            console.log(`No Universe ID found for Place ID ${placeId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching Universe ID for Place ID ${placeId}:`, error);
        return null;
    }
}

// Main function
async function main() {
    let links = await scrapeLinks();
    let universeIds = new Set();

    for (let link of links) {
        let placeId = extractPlaceId(link);
        if (placeId) {
            let universeId = await getUniverseId(placeId);
            if (universeId) {
                universeIds.add(universeId);
            }
        }
    }

    if (universeIds.size > 0) {
        // Save Universe IDs to JSON
        fs.writeFileSync("universe_data.json", JSON.stringify([...universeIds], null, 2));
        console.log("Saved Universe IDs to universe_data.json");
    } else {
        console.log("No Universe IDs found to save.");
    }
}

// Run the scraper
main();
