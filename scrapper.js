const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// DevForum URL to scrape
const DEVFORUM_URL = "https://devforum.roblox.com/c/some-category";
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
        const response = await axios.get(ROBLOX_API + placeId);
        const data = response.data;

        return data.data.length > 0 ? data.data[0].rootPlaceId : null;
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

    // Save Universe IDs to JSON
    fs.writeFileSync("universe_data.json", JSON.stringify([...universeIds], null, 2));
    console.log("Saved Universe IDs to universe_data.json");
}

// Run the scraper
main();
