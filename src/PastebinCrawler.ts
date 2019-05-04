import * as winston from "winston";
import * as request from "request-promise";
import * as cheerio from "cheerio";
import * as fs from "fs-extra";

export class PastebinCrawler {
    static get instance(): PastebinCrawler {
        return this._instance;
    }

    static set instance(value: PastebinCrawler) {
        this._instance = value;
    }

    get keywords(): Array<string> {
        return this._keywords;
    }

    set keywords(value: Array<string>) {
        this._keywords = value;
    }

    get logPath(): string {
        return this._logPath;
    }

    set logPath(value: string) {
        this._logPath = value;
    }

    get savePath(): string {
        return this._savePath;
    }

    set savePath(value: string) {
        this._savePath = value;
    }

    get logger(): winston.Logger {
        return this._logger;
    }

    set logger(value: winston.Logger) {
        this._logger = value;
    }

    get querySite(): () => Promise<any> {
        return this._querySite;
    }

    set querySite(value: () => Promise<any>) {
        this._querySite = value;
    }

    private static _instance: PastebinCrawler;

    private _keywords: Array<string>;
    private _logPath: string;
    private _savePath: string;
    private _logger: winston.Logger;

    private _lastPastelist: Array<any>;

    constructor(keywords: Array<string>, logPath: string, savePath: string){
        this._keywords = keywords;
        this._logPath = logPath;
        this.savePath = savePath;

        PastebinCrawler._instance = this;

        this._lastPastelist = new Array<string>();

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.File({ filename: logPath })
            ]
        });

    }

    public bootstrap = async () => {
        this.logger.log("Info", "Online");
        this._querySite();
    };

    private getPaste = async (pasteUri: string) => {
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
        this.keywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) save = true;
        });

        if (save) {
            this.logger.log("Save", "Found paste @ " + pasteUri);
            await fs.outputFile(this.savePath + Date.now() + ".txt", content);
        }
    };

    private _querySite = async () => {
        this.logger.log("Heartbeat", "Beat...");

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
                await this.getPaste(newItem);
                await this._delay(this.deviate(2000)); // Delay so we aren't sus
            }
        }));

        this._lastPastelist = newList;
        await this._delay(this.deviate(25000)); // We don't need to check the list every 10 ms lol

        this._querySite();
    };

    private _delay = async (ms: number) => {
        await new Promise(resolve => {
            setTimeout(() => {
                return resolve();
            }, ms)
        });
    };

    private deviate = (x: number): number => {
        const min = x * .1;
        const max = x * .2;

        const mod = Math.random() * (+max - +min) + +min;

        if (Math.random() > .5) x -= mod;
        else x += mod;

        return x;
    }
}