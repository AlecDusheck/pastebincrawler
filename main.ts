import {PastebinCrawler} from "./src/PastebinCrawler";

const crawler = new PastebinCrawler(["mysql", ".com", "password"], "log.json", "./pastes/");
crawler.bootstrap();