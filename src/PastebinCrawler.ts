import * as winston from "winston";
import * as request from "request-promise";
import * as cheerio from "cheerio";
import * as fs from "fs-extra";

export class PastebinCrawler {
    private static _instance: PastebinCrawler;

    private readonly _keywords: Array<string>;
    private readonly _logPath: string;
    private readonly _savePath: string;
    private readonly _logger: winston.Logger;

    static get instance(): PastebinCrawler {
        return this._instance;
    }

    static set instance(value: PastebinCrawler) {
        this._instance = value;
    }

    get lastPastelist(): Array<any> {
        return this._lastPastelist;
    }

    set lastPastelist(value: Array<any>) {
        this._lastPastelist = value;
    }

    get logger(): winston.Logger {
        return this._logger;
    }

    get savePath(): string {
        return this._savePath;
    }

    get keywords(): Array<string> {
        return this._keywords;
    }

    private readonly postReadDelay: number;
    private readonly sleepEnabled: boolean;
    private readonly refreshDelay: number;

    private _lastPastelist: Array<any>;

    constructor(keywords: Array<string>, logPath: string, savePath: string, postReadDelay: number, sleepEnabled: boolean, refreshDelay: number){
        this._keywords = keywords;
        this._logPath = logPath;
        this._savePath = savePath;

        this.postReadDelay = postReadDelay;
        this.sleepEnabled = sleepEnabled;
        this.refreshDelay = refreshDelay;

        PastebinCrawler._instance = this;

        this._lastPastelist = new Array<string>();

        this._logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console({ level: 'info' }),
                new winston.transports.File({ filename: logPath, level: "info" })
            ]
        });

    }

    public bootstrap = async () => {
        this._querySite();
    };

    private _getPaste = async (pasteUri: string) => {
        let content = "";

        const $ = cheerio.load(await request("https://pastebin.com" + pasteUri));
        $(".text").children().each((i, elm) => {
            // console.log(elm.firstChild);
            if (elm.firstChild.children){
                elm.firstChild.children.forEach(child => {
                    content = content + child.data + "\n";
                })
            }
        });

        let save = false;
        let trigger;
        this.keywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                save = true;
                trigger = keyword;
            }
        });

        if (save && trigger) {
            this.logger.info("Found paste @ " + pasteUri + " because of trigger \"" + trigger + "\"");
            await fs.outputFile(this.savePath + trigger + "/" + Date.now() + ".txt", content);
        }
    };

    private _querySite = async () => {
        // Get new list contents
        const newList = [];
        const $ = cheerio.load(await request("https://pastebin.com")); // Get the contents of pastebin
        $(".right_menu").children().each((i, elm) => { // Loop thru the right hand menu
            const tag = elm.children.filter(child => child.name == "a")[0]; // Get the first tag that is an 'a' tag
            if (tag.attribs.href) newList.push(tag.attribs.href); // Add the href
        });

        // Get different elements
        await Promise.all(newList.map(async (newItem) => {
            if (!this._lastPastelist.includes(newItem)){
                await this._getPaste(newItem);
                await this._delay(this._deviate(this.postReadDelay)); // Delay so we aren't sus
            }
        }));

        this._lastPastelist = newList;

        // Randomly rest so we don't get banned
        if (Math.random() < .2 && this.sleepEnabled){
            this.logger.info("Sleeping to prevent ban...");
            await this._delay(300 * 1000);
            this.logger.info("Sleeping done");
        } else {
            await this._delay(this._deviate(this.refreshDelay)); // We don't need to check the list every 10 ms lol
        }

        this._querySite();
    };

    private _delay = async (ms: number) => {
        await new Promise(resolve => {
            setTimeout(() => {
                return resolve();
            }, ms)
        });
    };

    private _deviate = (x: number): number => {
        const min = x * .1;
        const max = x * .3;

        const mod = Math.random() * (+max - +min) + +min;

        if (Math.random() > .8) x -= mod;
        else x += mod;

        return x;
    }
}