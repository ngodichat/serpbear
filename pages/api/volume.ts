import type { NextApiRequest, NextApiResponse } from 'next';
// import { Op } from 'sequelize';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import Keyword from '../../database/models/keyword';

type KeywordVolumeResponse = {
    settings?: object | null,
    error?: string,
 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const authorized = verifyUser(req, res);
    if (authorized !== 'authorized') {
       return res.status(401).json({ error: authorized });
    }
    if (req.method === 'POST') {
       return updateKeywordVolume(req, res);
    }

    return res.status(502).json({ error: 'Unrecognized Route.' });
 }

const updateKeywordVolume = async (req: NextApiRequest, res: NextApiResponse<KeywordVolumeResponse>) => {
    const { settings } = req.body || {};
    console.log('Received updating keyword volume request: ', settings);
    try {
        const allKeywords: Keyword[] = await Keyword.findAll();
        console.log('Number of keywords: ', allKeywords.length);

        // group keywords by country
        const groups: {[key: string]: any[]} = {};
        for (let i = 0; i < allKeywords.length; i += 1) {
            const keyword = allKeywords[i];
            if (!Object.keys(groups).includes(keyword.get('country'))) {
                groups[keyword.get('country')] = [];
            }
            groups[keyword.get('country')].push(keyword.get('keyword'));
        }
        Object.keys(groups).forEach((group) => {
            console.log(group, groups[group].length);
        });
        // // divide those keywords into batches of 1000 per batch
        // const result = [];
        // const chunkSize = 1000;
        // for (let i = 0; i < allKeywords.length; i += chunkSize) {
        //     result.push(allKeywords.slice(i, i + chunkSize));
        // }
        // console.log('Chunks: ', result.length, result[0].length);
        return res.status(200).json({});
    } catch (error) {
        console.log('[ERROR] Updating Keyword Volume: ', error);
        return res.status(400).json({ error: 'Error Updating Keyword Volume' });
    }
};
