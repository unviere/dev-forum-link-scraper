const axios = require("axios");
const fs = require("fs");

// DevForum URL and base structure
const BASE_URL = "https://devforum.roblox.com/raw/3389448?page=";
const MATCH_DOMAIN = "roblox.com/games/";

// Function to scrape content from a specific page
async function scrapePage(pageNumber) {
    try {
        const { data } = await axios.get(BASE_URL + pageNumber);
        console.log(`Scraping page ${pageNumber}...`);

        // Check if data contains relevant links
        let links = [];
        const regex = /https:\/\/www\.roblox\.com\/games\/\d+/g;
        const matches = data.match(regex);
        if (matches) {
            links = matches;
        }

        return links;
    } catch (error) {
        console.error(`Error scraping page ${pageNumber}:`, error);
        return [];
    }
}

// Main function to scrape multiple pages
async function scrapeMultiplePages() {
    let allLinks = [];
    let pageNumber = 1;
    let links;

    while (true) {
        links = await scrapePage(pageNumber);
        if (links.length === 0) {
            // No more links found, exit loop
            console.log("No more data found.");
            break;
        }

        allLinks = allLinks.concat(links);
        pageNumber++;
    }

    // Save all collected links to a JSON file
    if (allLinks.length > 0) {
        fs.writeFileSync("universe_data.json", JSON.stringify(allLinks, null, 2));
        console.log("Saved all links to universe_data.json");
    } else {
        console.log("No links found to save.");
    }
}

// Run the scraper
scrapeMultiplePages();
