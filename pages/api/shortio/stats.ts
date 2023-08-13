import { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const authorized = verifyUser(req, res);
    if (authorized !== 'authorized') {
        return res.status(401).json({ error: authorized });
    }
    if (req.method === 'GET') {
        return getStatsByDomain(req, res);
    }
    return res.status(405).json({ message: 'Method not allowed' });
}

const getStatsByDomain = async (req: NextApiRequest, res: NextApiResponse) => {
    if (!req.query.domain && typeof req.query.domain !== 'string') {
        return getAllStats(req, res);
    }
    const domainreq = (req.query.domain as string).toLowerCase();
    const domainObj: Domain | null = await Domain.findOne({ where: { slug: domainreq } });
    if (domainObj === null) return res.status(400).json({ error: 'Domain not found!' });
    const { domain } = domainObj;

    const [result] = await db.query(`SELECT date, sum(ls.humanClicks) as totalClicks from link_stats_new ls 
    join link l on l.ID = ls.link_id
    where l.tags like '%${domain}%'
    group by date`);
    // console.log('result: ', result);
    const resultObj: any = {};
    result.forEach((r: any) => {
        resultObj[r.date] = r.totalClicks;
    });
    return res.status(200).json({ stats: resultObj });
};

const getAllStats = async (req: NextApiRequest, res: NextApiResponse) => {
    const dateRange = (req?.query?.dateRange as string) ?? '30';
    let tagFilters = req.query.tags ?? [];
    if (!Array.isArray(tagFilters)) {
        tagFilters = [tagFilters];
    }
    const dateRangeCond = `and STR_TO_DATE(date, '%Y-%m-%d') >= DATE_SUB(NOW(), INTERVAL ${parseInt(dateRange, 10) + 1} DAY)`;
    if (tagFilters.length === 0) {
        const [result] = await db.query(`SELECT date, sum(ls.humanClicks) as totalClicks from link_stats_new ls 
        join link l on l.ID = ls.link_id
        ${dateRange !== 'all' ? dateRangeCond : ''}
        group by date`);
        const resultObj: any = {};
        result.forEach((r: any) => {
            resultObj[r.date] = r.totalClicks;
        });
        return res.status(200).json({ stats: resultObj });
    }
    const allDomains = await Domain.findAll({});
    const filteredDomains = allDomains.filter((domain) => {
        if (tagFilters.length === 0) return true;
        const tags = JSON.parse(domain.tags);
        for (let i = 0; i < tags.length; i += 1) {
            const tag = tags[i];
            if (tagFilters.includes(tag)) return true;
        }
        return false;
    });
    let domainFilterCond = '';
    if (filteredDomains.length > 0) {
        domainFilterCond = `where l.tags like '%${filteredDomains[0].domain}%'`;
        for (let i = 1; i < filteredDomains.length; i += 1) {
            const domain = filteredDomains[i];
            domainFilterCond = `${domainFilterCond} or l.tags like '%${domain.domain}%'`;
        }
    }
    console.log('domainFilterCond: ', domainFilterCond);
    const [result] = await db.query(`SELECT date, sum(ls.humanClicks) as totalClicks from link_stats_new ls 
        join link l on l.ID = ls.link_id
        ${dateRange !== 'all' ? dateRangeCond : ''}
        ${domainFilterCond}
        group by date`);
    const resultObj: any = {};
    result.forEach((r: any) => {
        resultObj[r.date] = r.totalClicks;
    });
    return res.status(200).json({ stats: resultObj });
};
