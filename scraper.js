const axios = require("axios");
const fs = require("fs");

// DevForum URL and base structure
const BASE_URL = "https://devforum.roblox.com/raw/3389448?page=";

// Function to scrape content from a specific page
async function scrapePage(pageNumber) {
    try {
        const { data } = await axios.get(BASE_URL + pageNumber);
        console.log(`Scraping page ${pageNumber}...`);

        // Check if the page content is entirely empty
        if (!data || data.trim() === "") {
            console.log(`Page ${pageNumber} has no content.`);
            return null; // Indicates no content on this page
        }

        // Otherwise, check for relevant links
        let links = [];
        const regex = /https:\/\/www\.roblox\.com\/games\/\d+/g;
        const matches = data.match(regex);
        
        if (matches) {
            console.log(`Found links on page ${pageNumber}:`, matches);
            links = matches;
        }

        return links;
    } catch (error) {
        console.error(`Error scraping page ${pageNumber}:`, error);
        return null;
    }
}

// Main function to scrape multiple pages
async function scrapeMultiplePages() {
    let allLinks = [];
    let pageNumber = 1;
    let links;

    while (true) {
        links = await scrapePage(pageNumber);

        // Stop scraping if the page is empty (i.e., no content)
        if (links === null) {
            console.log("No content found on this page. Stopping...");
            break;
        }

        // Add found links to the collection
        allLinks = allLinks.concat(links);
        pageNumber++;  // Move to the next page
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
