import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';

type KeywordsGetResponse = {
    keywords?: Keyword[],
    count?: number,
    byDevice?: any,
    error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const authorized = verifyUser(req, res);
    if (authorized !== 'authorized') {
        return res.status(401).json({ error: authorized });
    }

    if (req.method === 'GET') {
        return getKeywords(req, res);
    }
    return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
    const pageSize = 20;
    const currentPage = parseInt((req.query.page as string), 10);
    const { domain, search, country } = req.query;
    console.log(domain, search, country);

    try {
        let baseQuery = `SELECT a.id as ID,  a.keyword, a.lastResult,  country, device, volume, low_top_of_page_bid, high_top_of_page_bid, lastUpdated, tags, a.history
        FROM    keyword a
            INNER JOIN
            (
                SELECT keyword, MIN(id) id
                FROM keyword 
                GROUP BY keyword, country, device
            ) b
                ON a.keyword = b.keyword AND
                    a.id = b.id
        where lastResult like '%${domain ?? ''}%'
        and a.keyword like '%${search ?? ''}%'
        `;
        if (country) {
            const transform = (country as string).split(',').map((i: any) => `'${i}'`).join(',');
            baseQuery = `${baseQuery} and country in (${transform})`;
        }
        const countByDeviceQuery = `select device, count(1) as count from (${baseQuery}) as temp group by device`;

        const [result] = await db.query(`${baseQuery} limit ${pageSize} offset ${(currentPage - 1) * pageSize}`);
        const [total] = await db.query(countByDeviceQuery);
        console.log('total: ', total);
        const processedKeywords: any = [];
        result.forEach((r: any) => {
            processedKeywords.push(r);
        });
        // const integratedSC = process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL;
        // const domainSCData = integratedSC ? await readLocalSCData(domain) : false;
        const finalProcessedKeywords = processedKeywords.map((keyword: any) => {
            const historyArray = Object.keys(keyword.history).map((dateKey: string) => ({
                date: new Date(dateKey).getTime(),
                dateRaw: dateKey,
                position: keyword.history[dateKey],
            }));
            const historySorted = historyArray.sort((a, b) => a.date - b.date);
            const lastWeekHistory: KeywordHistory = {};
            historySorted.slice(-7).forEach((x: any) => { lastWeekHistory[x.dateRaw] = x.position; });
            const keywordWithSlimHistory = { ...keyword, lastResult: [], history: lastWeekHistory };
            // const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
            return keywordWithSlimHistory;
        });

        // const [count] = await db.query(baseQuery);
        return res.status(200).json({
            keywords: finalProcessedKeywords,
            count: total.reduce((a: number, b: any) => a + b.count, 0),
            byDevice: total.reduce((prev: any, item: any) => {
                const temp = { ...prev };
                temp[item.device] = item.count;
                return temp;
            }, {}),
        });
    } catch (error) {
        console.log('Error loading keywords: ', error);
        return res.status(400).json({ error: 'Error Loading all Keywords.' });
    }
};
