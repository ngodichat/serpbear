import { performance } from 'perf_hooks';
import { RefreshResult, scrapeKeywordFromGoogle } from './scraper';
import sleep from './sleep';
import Keyword from '../database/models/keyword';
import { COLORS, logWithColor } from './logs';

/**
 * Refreshes the Keywords position by Scraping Google Search Result by
 * Determining whether the keywords should be scraped in Parallel or not
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshKeywords = async (keywords: KeywordType[], settings: SettingsType, useExistingData: boolean = false): Promise<RefreshResult[]> => {
   if (!keywords || keywords.length === 0) { return []; }
   const start = performance.now();

   let refreshedResults: RefreshResult[] = [];

   if (['scrapingant', 'serpapi'].includes(settings.scraper_type)) {
      refreshedResults = await refreshParallel(keywords, settings);
   } else {
      for await (const kwrd of keywords) {
         if (useExistingData) {
            // check if the scrape info already existed for other domain (keyword, device, country), if yes -> take it
            const { keyword, device, country, domain } = kwrd;
            const keywordFound = await Keyword.findOne({ where: { keyword, device, country } });
            if (keywordFound) {
               logWithColor(`Found scrape info from keyword: ${keyword}`, COLORS.yellow);
               const lastResult = JSON.parse(keywordFound.lastResult);
               const refreshedkeywordData = { ID: keywordFound.ID, keyword: keywordFound.keyword, position: keywordFound.position, url: keywordFound.url, result: lastResult, error: false, country: keywordFound.country };
               lastResult.forEach((r: any) => {
                  if (r.url.includes(domain)) {
                     refreshedkeywordData.position = r.position;
                     refreshedkeywordData.url = r.url;
                  }
               });
               refreshedResults.push(refreshedkeywordData);
            } else {
               logWithColor(`START SCRAPE: ${kwrd.keyword}`, COLORS.red);
               const refreshedkeywordData = await scrapeKeywordFromGoogle(kwrd, settings);
               refreshedResults.push(refreshedkeywordData);
               await sleep(100);
            }
         } else {
            logWithColor(`START SCRAPE: ${kwrd.keyword}`, COLORS.red);
            const refreshedkeywordData = await scrapeKeywordFromGoogle(kwrd, settings);
            refreshedResults.push(refreshedkeywordData);
            await sleep(100);
         }
      }
   }

   const end = performance.now();
   console.log(`time taken: ${end - start}ms`);
   return refreshedResults;
};

/**
 * Scrape Google Keyword Search Result in Parallel.
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshParallel = async (keywords: KeywordType[], settings: SettingsType): Promise<RefreshResult[]> => {
   const promises: Promise<RefreshResult>[] = keywords.map((keyword) => {
      return scrapeKeywordFromGoogle(keyword, settings);
   });

   return Promise.all(promises).then((promiseData) => {
      console.log('ALL DONE!!!');
      return promiseData;
   }).catch((err) => {
      console.log(err);
      return [];
   });
};

export default refreshKeywords;
