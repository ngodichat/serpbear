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
        console.log('Get');
        return getStatsByDomain(req, res);
    }
    return res.status(405).json({ message: 'Method not allowed' });
}

const getStatsByDomain = async (req: NextApiRequest, res: NextApiResponse) => {
    if (!req.query.domain && typeof req.query.domain !== 'string') {
        return res.status(400).json({ error: 'Domain is Required!' });
    }
    const domainreq = (req.query.domain as string).toLowerCase();
    const domainObj: Domain | null = await Domain.findOne({ where: { slug: domainreq } });
    if (domainObj === null) return res.status(400).json({ error: 'Domain not found!' });
    const { domain } = domainObj;

    const [result] = await db.query(`SELECT date, sum(ls.humanClicks) as totalClicks from link_stats ls 
    join link l on l.ID = ls.link_id
    where l.tags like '%${domain}%'
    group by date`);
    console.log('result: ', result);
    const resultObj: any = {};
    result.forEach((r: any) => {
        resultObj[r.date] = r.totalClicks;
    });
    return res.status(200).json({ stats: resultObj });
};
