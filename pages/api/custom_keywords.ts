import type { NextApiRequest, NextApiResponse } from 'next';
import { Op, Sequelize } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import { refreshAndUpdateKeywords } from './refresh';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { integrateKeywordSCData, readLocalSCData } from '../../utils/searchConsole';
import Domain from '../../database/models/domain';

type KeywordsGetResponse = {
    keywords?: Keyword[],
    count?: number, 
    error?: string | null,
}

type KeywordsDeleteRes = {
    domainRemoved?: number,
    keywordsRemoved?: number,
    error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    //    const authorized = verifyUser(req, res);
    //    if (authorized !== 'authorized') {
    //       return res.status(401).json({ error: authorized });
    //    }

    if (req.method === 'GET') {
        return getKeywords(req, res);
    }
    return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
    const pageSize = 100;
    const currentPage = parseInt((req.query.page as string), 10);
    const url = req.query.url;
    try {
        // const processedKeywords = await Keyword.findAll({
        //     attributes: [
        //         [Sequelize.fn('DISTINCT', Sequelize.col('keyword')), 'keyword'],
        //         'country',
        //         'device',
        //         'volume',
        //         'low_top_of_page_bid',
        //         'high_top_of_page_bid',
        //         'lastUpdated',
        //         'tags'
        //     ],
        //     limit: pageSize,
        //     offset: (currentPage - 1) * pageSize
        // });

        const baseQuery = `SELECT a.id,  a.keyword, country, device, volume, low_top_of_page_bid, high_top_of_page_bid, lastUpdated, tags
        FROM    keyword a
            INNER JOIN
            (
                SELECT keyword, MIN(id) id
                FROM keyword 
                GROUP BY keyword, country, device
            ) b
                ON a.keyword = b.keyword AND
                    a.id = b.id
        where lastResult like '%${url ?? ""}%'`;
        const [result] = await db.query(`${baseQuery} limit ${pageSize} offset ${(currentPage - 1) * pageSize}`);
        const processedKeywords: any = [];
        result.forEach((r: any) => {
            processedKeywords.push(r);
        });

        const [count] = await db.query(baseQuery);
        return res.status(200).json({ keywords: processedKeywords, count: count.length });
    } catch (error) {
        return res.status(400).json({ error: 'Error Loading all Keywords.' });
    }
};