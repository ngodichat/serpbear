import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import Keyword from '../../database/models/keyword';
import Country from '../../database/models/country';

type KeywordVolumeResponse = {
    settings?: object | null,
    error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync({ alter: true });
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
    if (settings.keyword_volume_type === 'dataforseo') {
        try {
            const username = settings.keyword_volume_username;
            const password = settings.keyword_volume_password;
            const countriesLimit = settings.keyword_volume_countries_limit.split(',');
            const allKeywords: Keyword[] = await Keyword.findAll({
                where: {
                  country: {
                    [Op.in]: countriesLimit,
                  },
                },
              });
            const allCountries: Country[] = await Country.findAll();
            const countryDict: any = {};
            allCountries.forEach((country) => {
                if (countriesLimit.includes(country.get('country_iso_code'))) {
                    countryDict[country.get('country_iso_code')] = country.get('location_code');
                }
            });
            console.log('countryDict: ', countryDict);
            console.log('allKeywords: ', allKeywords.length);

            // group keywords by country
            const groups: { [key: string]: any[] } = {};
            for (let i = 0; i < allKeywords.length; i += 1) {
                const keyword = allKeywords[i];
                const country = keyword.get('country');
                if (!countryDict[country]) {
                    console.log('Error mapping country code: ', country);
                } else {
                    // const countryCode = countryDict[country];
                    const k = keyword.get('keyword').trim();
                    if (!Object.keys(groups).includes(country)) {
                        groups[country] = [];
                    }
                    if (!groups[country].includes(k)) {
                        groups[country].push(k);
                    }
                }
            }
            // create task list
            const tasks: any[] = [];
            Object.keys(groups).forEach((group) => {
                const listKeywords = groups[group];
                // console.log('Group: ', group, listKeywords.length);
                const results = [];
                const chunkSize = 1000;
                for (let i = 0; i < listKeywords.length; i += chunkSize) {
                    results.push(listKeywords.slice(i, i + chunkSize));
                }
                results.forEach((result) => {
                    const task = {
                        location_code: countryDict[group],
                        keywords: result,
                    };
                    tasks.push(task);
                });
            });
            console.log('task: ', tasks[0]);            
            createPostTasksDataForSeo(tasks, username, password).then((response) => response.json())
                .then((data) => {
                    // console.log('List of task ids: ', data, data.tasks.filter((item: any) => item.status_code === 20100).map((item: any) => item.id));
                    getReadyTasksDataForSeo(data.tasks.filter((item: any) => item.status_code === 20100).map((item: any) => item.id), username, password);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            return res.status(200).json({});
        } catch (error) {
            console.log('[ERROR] Updating Keyword Volume: ', error);
            return res.status(400).json({ error: 'Error Updating Keyword Volume' });
        }
    }
    return res.status(200).json({});
};

const createPostTasksDataForSeo = async (tasks: any[], username: string, password: string) => {
    let client: Promise<Response> | false = false;
    const bearer = btoa(`${username}:${password}`);
    console.log('List of tasks sent: ', tasks.length);
    const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        Accept: 'application/json; charset=utf8;',
        Authorization: `Basic ${bearer}`,
    };
    client = fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_post', { method: 'POST', headers, body: JSON.stringify(tasks) });
    // client = fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/02200151-5209-0110-0000-b0c08592be4f', { method: 'GET', headers });
    return client;
};

const getReadyTasksDataForSeo = async (tasks_: any[], username: string, password: string) => {
    // let client: Promise<Response> | false = false;
    const bearer = btoa(`${username}:${password}`);
    const tasks = [...tasks_];
    const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        Accept: 'application/json; charset=utf8;',
        Authorization: `Basic ${bearer}`,
    };
    //  client = fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_post', { method: 'POST', headers, body:  JSON.stringify(tasks) })
    // let i = 0;
    while (tasks.length > 0) {
        const task = tasks.shift();
        console.log(task);
        const res = await fetch(`https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/${task}`, { method: 'GET', headers });
        const data = await res.json();
        const { result, status_code } = data.tasks[0];
        if (result) {
            console.log('Result: ', result);
            const country: Country | null = await Country.findOne({ where: { location_code: result[0].location_code } });
            if (country) {
                const countryCode = country.country_iso_code;
                const promises = result.map(async (r: any) => {
                    const { keyword, search_volume, low_top_of_page_bid, high_top_of_page_bid } = r;

                    // Update all the Keyword records found
                    return Keyword.update(
                        { volume: search_volume, low_top_of_page_bid, high_top_of_page_bid },
                        { where: { keyword, country: countryCode } },
                    );
                });
                const keywords = await Keyword.findAll({ where: { keyword: 'data labeling', country: countryCode } });
                console.log('keyword: ', keywords);
                await Promise.all(promises);
            }
        } else {
            if (status_code !== 40401) {
                console.log('Task not ready --> insert back');
                tasks.unshift(task);
            }
            await sleep(3000);
        }
    }
    // return data;
    // return client;
};

const sleep = (ms: number) => {
    return new Promise((resolve, reject) => {
        if (ms < 0) {
            reject(new Error('Invalid sleep time'));
        } else {
            setTimeout(resolve, ms);
        }
    });
};
