import type { NextApiRequest, NextApiResponse } from 'next';
import { Sequelize } from 'sequelize';
import db from '../../../database/database';
import Keyword from '../../../database/models/keyword';
import verifyUser from '../../../utils/verifyUser';

type KeywordsCountByCountryResponse = {
    keywordsCountByCountry?: Keyword[],
    error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const authorized = verifyUser(req, res);
    if (authorized !== 'authorized') {
        return res.status(401).json({ error: authorized });
    }

    if (req.method === 'GET') {
        const withStats = !!req?.query?.groupByCountry;
        if (withStats) return keywordsCountByCountry(req, res);
    }
    return res.status(502).json({ error: 'Unrecognized Route.' });
}

const keywordsCountByCountry = async (req: NextApiRequest, res: NextApiResponse<KeywordsCountByCountryResponse>) => {
    try {
        const keywordStats = await Keyword.findAll({
            attributes: [
                'country',
                [Sequelize.fn('COUNT', Sequelize.col('keyword')), 'keyword_count'],
                [Sequelize.fn('MAX', Sequelize.col('lastUpdated')), 'max_lastUpdated'],
            ],
            group: ['country'],
            order: [Sequelize.literal('keyword_count DESC')],
        });
        return res.status(200).json({ keywordsCountByCountry: keywordStats });
    } catch (err) {
        console.error(err);
        throw err;
    }
};
