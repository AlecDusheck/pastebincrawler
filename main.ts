import {PastebinCrawler} from "./src/PastebinCrawler";

let postReadDelay = 5 * 1000;
let sleepEnabled = true;
let refreshDelay = 45 * 1000;

let terms = ["testing", "looking for pastes?"];

process.argv.forEach((val, index, array) => {
    if (val === "-shotgun") {
        sleepEnabled = false;
        refreshDelay = 25 * 1000;
        console.log("Warning: Shotgun mode enabled. You will be banned within 10ish minutes!")
    } else if (val === "-terms") {
        if (index + 1 >= array.length) return;

        terms = array[index + 1].split(",");
        console.log("Using terms override: " + terms);
    }
});

const crawler = new PastebinCrawler(terms, "log.json", "./pastes/", postReadDelay, sleepEnabled, refreshDelay);
crawler.bootstrap();