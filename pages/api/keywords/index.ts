import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../../database/database';
import Keyword from '../../../database/models/keyword';
import { refreshAndUpdateKeywords } from '../refresh';
import { getAppSettings } from '../settings';
import verifyUser from '../../../utils/verifyUser';
import parseKeywords from '../../../utils/parseKeywords';
import { integrateKeywordSCData, readLocalSCData } from '../../../utils/searchConsole';
import Domain from '../../../database/models/domain';

type KeywordsGetResponse = {
   keywords?: KeywordType[],
   error?: string | null,
}

type KeywordsDeleteRes = {
   domainRemoved?: number,
   keywordsRemoved?: number,
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }

   if (req.method === 'GET') {
      const withStats = !!req?.query?.withstats;
      if (withStats) return getKeywordsStats(req, res);
      return getKeywords(req, res);
   }
   if (req.method === 'POST') {
      return addKeywords(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteKeywords(req, res);
   }
   if (req.method === 'PUT') {
      return updateKeywords(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ error: 'Domain is Required!' });
   }
   const domainreq = (req.query.domain as string).toLowerCase();
   const domainObj: Domain | null = await Domain.findOne({ where: { slug: domainreq } });
   if (domainObj === null) return res.status(400).json({ error: 'Domain not found!' });
   const { domain } = domainObj;
   const integratedSC = process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL;
   const domainSCData = integratedSC ? await readLocalSCData(domain) : false;

   try {
      const allKeywords: Keyword[] = await Keyword.findAll({ where: { domain } });
      const keywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      const processedKeywords = keywords.map((keyword) => {
         const historyArray = Object.keys(keyword.history).map((dateKey: string) => ({
            date: new Date(dateKey).getTime(),
            dateRaw: dateKey,
            position: keyword.history[dateKey],
         }));
         const historySorted = historyArray.sort((a, b) => a.date - b.date);
         const lastWeekHistory: KeywordHistory = {};
         historySorted.slice(-7).forEach((x: any) => { lastWeekHistory[x.dateRaw] = x.position; });
         const keywordWithSlimHistory = { ...keyword, lastResult: [], history: lastWeekHistory };
         const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
         return finalKeyword;
      });
      return res.status(200).json({ keywords: processedKeywords });
   } catch (error) {
      console.log('[ERROR] Getting Domain Keywords for ', domain, error);
      return res.status(400).json({ error: 'Error Loading Keywords for this Domain.' });
   }
};

function cleanString(input: string) {
   // Define a regular expression pattern to match the specified characters
   const pattern = /[,!@%^()={};~`<>?\\|―-]/g;

   // Replace matched characters with an empty string
   const cleaned = input.replace(pattern, '');

   return cleaned;
}

const addKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
   const { keywords, ignoreDuplicates, useExistingData } = req.body;
   console.log(keywords, ignoreDuplicates, useExistingData);
   if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      // const keywordsArray = keywords.replaceAll('\n', ',').split(',').map((item:string) => item.trim());
      const keywordsToAdd: any = []; // QuickFIX for bug: https://github.com/sequelize/sequelize-typescript/issues/936

      // get all volumes of existed keywords for that country
      const keywordsVolume = await getKeywordsVolumeByCountry(keywords[0].country);
      const keywordVolumeMap: any = {};
      keywordsVolume.forEach((kv: any) => {
         keywordVolumeMap[kv.keyword] = kv.volume;
      });
      keywords.forEach((kwrd: KeywordAddPayload) => {
         const { keyword, device, country, domain, tags } = kwrd;
         if (domain !== '') {
            const tagsArray = tags ? tags.split(',').map((item: string) => item.trim()) : [];
            const newKeyword = {
               keyword: cleanString(keyword),
               device,
               domain,
               country,
               position: 0,
               updating: true,
               history: JSON.stringify({}),
               url: '',
               tags: JSON.stringify(tagsArray),
               sticky: false,
               lastUpdated: new Date().toJSON(),
               added: new Date().toJSON(),
               volume: keywordVolumeMap[cleanString(keyword)],
            };
            keywordsToAdd.push(newKeyword);
         }
      });

      try {
         /* const newKeywords: Keyword[] = await Keyword.bulkCreate(keywordsToAdd);
         const formattedkeywords = newKeywords.map((el) => el.get({ plain: true }));
         const keywordsParsed: KeywordType[] = parseKeywords(formattedkeywords);
         const settings = await getAppSettings();
         refreshAndUpdateKeywords(newKeywords, settings); // Queue the SERP Scraping Process
         return res.status(201).json({ keywords: keywordsParsed }); */
         return res.status(200);
      } catch (error) {
         console.log('[ERROR] Adding New Keywords ', error);
         return res.status(400).json({ error: 'Could Not Add New Keyword!' });
      }
   } else {
      return res.status(400).json({ error: 'Necessary Keyword Data Missing' });
   }
};

const deleteKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsDeleteRes>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   console.log('req.query.id: ', req.query.id);

   try {
      const keywordsToRemove = (req.query.id as string).split(',').map((item) => parseInt(item, 10));
      const removeQuery = { where: { ID: { [Op.in]: keywordsToRemove } } };
      const removedKeywordCount: number = await Keyword.destroy(removeQuery);
      return res.status(200).json({ keywordsRemoved: removedKeywordCount });
   } catch (error) {
      console.log('[ERROR] Removing Keyword. ', error);
      return res.status(400).json({ error: 'Could Not Remove Keyword!' });
   }
};

const updateKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   if (req.body.sticky === undefined && !req.body.tags === undefined) {
      return res.status(400).json({ error: 'keyword Payload Missing!' });
   }
   const keywordIDs = (req.query.id as string).split(',').map((item) => parseInt(item, 10));
   const { sticky, tags } = req.body;

   try {
      let keywords: KeywordType[] = [];
      if (sticky !== undefined) {
         await Keyword.update({ sticky }, { where: { ID: { [Op.in]: keywordIDs } } });
         const updateQuery = { where: { ID: { [Op.in]: keywordIDs } } };
         const updatedKeywords: Keyword[] = await Keyword.findAll(updateQuery);
         const formattedKeywords = updatedKeywords.map((el) => el.get({ plain: true }));
         keywords = parseKeywords(formattedKeywords);
         return res.status(200).json({ keywords });
      }
      if (tags) {
         const tagsKeywordIDs = Object.keys(tags);
         const multipleKeywords = tagsKeywordIDs.length > 1;
         for (const keywordID of tagsKeywordIDs) {
            const selectedKeyword = await Keyword.findOne({ where: { ID: keywordID } });
            const currentTags = selectedKeyword && selectedKeyword.tags ? JSON.parse(selectedKeyword.tags) : [];
            const mergedTags = Array.from(new Set([...currentTags, ...tags[keywordID]]));
            if (selectedKeyword) {
               await selectedKeyword.update({ tags: JSON.stringify(multipleKeywords ? mergedTags : tags[keywordID]) });
            }
         }
         return res.status(200).json({ keywords });
      }
      return res.status(400).json({ error: 'Invalid Payload!' });
   } catch (error) {
      console.log('[ERROR] Updating Keyword. ', error);
      return res.status(200).json({ error: 'Error Updating keywords!' });
   }
};

const getKeywordsStats = async (req: NextApiRequest, res: NextApiResponse<any>) => {
   const keywords = await Keyword.findAll();
   let mobile: number = 0;
   let desktop: number = 0;
   keywords.forEach((k) => {
      if (k.device === 'desktop') {
         desktop += 1;
      } else {
         mobile += 1;
      }
   });
   return res.status(200).json({ mobile, desktop });
};

/**
 * @param country US
 * @returns list of keywords with their volumes
 */
const getKeywordsVolumeByCountry = async (country: string) => {
   try {
      // Await the Sequelize promise to resolve
      const keywords = await Keyword.findAll({
         attributes: ['keyword', 'country', 'volume'], // Selecting only keyword, country, and volume columns
         where: {
            country, // Using the countryInput variable in the where clause
            volume: {
               [Op.ne]: null, // volume is not null
            },
         },
         order: [
            ['keyword', 'ASC'], // Ordering by keyword in ascending order
            ['country', 'ASC'], // Ordering by country in ascending order
         ],
         group: ['keyword', 'country', 'volume'], // To get distinct rows
      });

      // Return the retrieved keywords
      return keywords;
   } catch (err) {
      // Log any error that occurs during the query and rethrow it
      console.error(err);
      throw err;
   }
};
