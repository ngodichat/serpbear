import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import getdomainStats from '../../utils/domains';
import verifyUser from '../../utils/verifyUser';

type DomainsGetRes = {
   domains: DomainType[]
   error?: string|null,
}

type DomainsAddResponse = {
   domain: Domain|null,
   error?: string|null,
}

type DomainsDeleteRes = {
   domainRemoved: number,
   keywordsRemoved: number,
   error?: string|null,
}

type DomainsUpdateRes = {
   domain: Domain|null,
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getDomains(req, res);
   }
   if (req.method === 'POST') {
      return addDomain(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteDomain(req, res);
   }
   if (req.method === 'PUT') {
      return updateDomain(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

export const getDomains = async (req: NextApiRequest, res: NextApiResponse<DomainsGetRes>) => {
   const withStats = !!req?.query?.withstats;
   const dateRange = (req?.query?.dateRange as string) ?? '30';
   console.log('dateRange: ', dateRange);
   try {
      // const allDomains: Domain[] = await Domain.findAll();
      const [result] = await db.query(`with tmp as (
         SELECT l.tags as domainTags, sum(humanClicks) as totalClicks from link_stats_new ls 
         join link l on l.ID = ls.link_id
         where l.tags like '%http%'
         and STR_TO_DATE(date, '%Y-%m-%d') >= DATE_SUB(NOW(), INTERVAL ${parseInt(dateRange, 10) + 1} DAY)
         group by l.tags)
         select d.*, totalClicks from domain d
         left join tmp on tmp.domainTags like CONCAT('%', d.domain, '%')
         order by totalClicks desc`);
      const results: DomainType[] = result.map((e: any) => ({
         ID: e.ID,
         domain: e.domain,
         slug: e.slug,
         tags: e.tags,
         notification: e.notification,
         notification_interval: e.notification_interval,
         notification_emails: e.notification_emails,
         lastUpdated: e.lastUpdated,
         added: e.added,
         keywordCount: e.keywordCount,
         keywordsUpdated: e.keywordsUpdated,
         avgPosition: e.avgPosition,
         scVisits: e.scVisits,
         scImpressions: e.scImpressions,
         scPosition: e.scPosition,
         auto_refresh: e.auto_refresh,
         target_trust_flow: e.target_trust_flow,
         target_citation_flow: e.target_citation_flow,
         target_topical_trust_flow_topic: e.target_topical_trust_flow_topic,
         target_topical_trust_flow_value: e.target_topical_trust_flow_value,
         totalClicks: e.totalClicks,
      }));
      const theDomains: any[] = withStats ? await getdomainStats(results) : results;
      return res.status(200).json({ domains: theDomains });
   } catch (error) {
      return res.status(400).json({ domains: [], error: 'Error Getting Domains.' });
   }
};

export const addDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsAddResponse>) => {
   if (!req.body.domain) {
      return res.status(400).json({ domain: null, error: 'Error Adding Domain.' });
   }
   const { domain } = req.body || {};
   const domainData = {
      domain: domain.trim().toLowerCase(),
      slug: domain.trim().replaceAll('-', '_').replaceAll('.', '-').replaceAll('/', '=')
      .toLowerCase(),
      lastUpdated: new Date().toJSON(),
      added: new Date().toJSON(),
   };

   try {
      const addedDomain = await Domain.create(domainData);
      return res.status(201).json({ domain: addedDomain });
   } catch (error) {
      return res.status(400).json({ domain: null, error: 'Error Adding Domain.' });
   }
};

export const deleteDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsDeleteRes>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, error: 'Domain is Required!' });
   }
   try {
      const { domain } = req.query || {};
      const removedDomCount: number = await Domain.destroy({ where: { domain } });
      const removedKeywordCount: number = await Keyword.destroy({ where: { domain } });
      return res.status(200).json({
            domainRemoved: removedDomCount,
            keywordsRemoved: removedKeywordCount,
         });
   } catch (error) {
      console.log('[ERROR] Deleting Domain: ', req.query.domain, error);
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, error: 'Error Deleting Domain' });
   }
};

export const updateDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsUpdateRes>) => {
   if (!req.query.domain) {
      return res.status(400).json({ domain: null, error: 'Domain is Required!' });
   }
   const { domain } = req.query || {};
   const { notification_interval, notification_emails, auto_refresh } = req.body;

   try {
      const domainToUpdate: Domain|null = await Domain.findOne({ where: { domain } });
      if (domainToUpdate) {
         domainToUpdate.set({ notification_interval, notification_emails, auto_refresh });
         await domainToUpdate.save();
      }
      return res.status(200).json({ domain: domainToUpdate });
   } catch (error) {
      console.log('[ERROR] Updating Domain: ', req.query.domain, error);
      return res.status(400).json({ domain: null, error: 'Error Updating Domain' });
   }
};
