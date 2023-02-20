import type { NextApiRequest, NextApiResponse } from 'next';
// import { Op } from 'sequelize';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import Keyword from '../../database/models/keyword';
import Country from '../../database/models/country';

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
        const allCountries: Country[] = await Country.findAll();
        const countryDict: any = {};
        allCountries.forEach((country) => {
            countryDict[country.get('country_iso_code')] = country.get('location_code');
        });

        // group keywords by country
        const groups: {[key: string]: any[]} = {};
        for (let i = 0; i < allKeywords.length; i += 1) {
            const keyword = allKeywords[i];
            const country = keyword.get('country');
            if (!countryDict[country]) {
                console.log('Error mapping country code: ', country);
            } else {
                const countryCode = countryDict[country];
                const k = keyword.get('keyword').trim();
                if (!Object.keys(groups).includes(countryCode)) {
                    groups[countryCode] = [];
                }
                if (!groups[countryCode].includes(k)) {
                    groups[countryCode].push(k);
                }
            }
        }
        // create task list
        const tasks: any = [];
        Object.keys(groups).forEach((group) => {
            const listKeywords = groups[group];
            console.log('Group: ', group, listKeywords.length);
            const results = [];
            const chunkSize = 1000;
            for (let i = 0; i < listKeywords.length; i += chunkSize) {
                results.push(listKeywords.slice(i, i + chunkSize));
            }
            results.forEach((result) => {
                const task = {
                    location_code: group,
                    keywords: result,
                };
                tasks.push(task);
            });
        });
        console.log(tasks);
        return res.status(200).json({});
    } catch (error) {
        console.log('[ERROR] Updating Keyword Volume: ', error);
        return res.status(400).json({ error: 'Error Updating Keyword Volume' });
    }
};
