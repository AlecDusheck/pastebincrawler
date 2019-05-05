import {PastebinCrawler} from "./src/PastebinCrawler";

let postReadDelay = 5 * 1000;
let sleepEnabled = true;
let refreshDelay = 45 * 1000;

process.argv.forEach((val, index, array) => {
    if (val === "-shotgun"){
        sleepEnabled = false;
        refreshDelay = 25 * 1000;
        console.log("Warning: Shotgun mode enabled. You will be banned within 10ish minutes!")
    }
});

const crawler = new PastebinCrawler(["mysql", ".com", "password", "http"], "log.json", "./pastes/", postReadDelay, sleepEnabled, refreshDelay);
crawler.bootstrap();