import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import { refreshAndUpdateKeywords } from './refresh';
import Domain from '../../database/models/domain';

type CRONRefreshRes = {
   started: boolean
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   console.log('Cron called');
   await db.sync();
   console.log('Cron called 1');
   const authorized = verifyUser(req, res);
   console.log('Cron called 2: ', authorized);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'POST') {
      return cronRefreshkeywords(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const cronRefreshkeywords = async (req: NextApiRequest, res: NextApiResponse<CRONRefreshRes>) => {
   try {
      console.log('cronRefreshkeywords');
      const settings = await getAppSettings();
      if (!settings || (settings && settings.scraper_type === 'never')) {
         return res.status(400).json({ started: false, error: 'Scraper has not been set up yet.' });
      }
      const allDomains: Domain[] = await Domain.findAll();
      const autoRefreshDomains: string[] = allDomains.filter((domain) => domain.auto_refresh === true).map((domain) => domain.domain);
      await Keyword.update({ updating: true }, { where: {} });
      const keywordQueries: Keyword[] = await Keyword.findAll();
      console.log('List of keyword before filtering: ', keywordQueries.map((k) => k.keyword));
      const keywordQueriesWithAutoRefresh: Keyword[] = keywordQueries.filter((keyword) => autoRefreshDomains.includes(keyword.domain));
      console.log('List of keyword after filtering: ', keywordQueriesWithAutoRefresh.map((k) => k.keyword));
      refreshAndUpdateKeywords(keywordQueriesWithAutoRefresh, settings);

      return res.status(200).json({ started: true });
   } catch (error) {
      console.log('[ERROR] CRON Refreshing Keywords: ', error);
      return res.status(400).json({ started: false, error: 'CRON Error refreshing keywords!' });
   }
};
