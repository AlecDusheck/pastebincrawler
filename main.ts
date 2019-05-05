import {PastebinCrawler} from "./src/PastebinCrawler";

const crawler = new PastebinCrawler(["mysql", ".com", "password", "http"], "log.json", "./pastes/");
crawler.bootstrap();