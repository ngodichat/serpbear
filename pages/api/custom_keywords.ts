import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'json2csv';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';

type KeywordsGetResponse = {
    keywords?: Keyword[],
    tags?: string[],
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

    if (req.method === 'POST') {
        if (req.query.export === 'csv') {
            return exportCSV(req, res);
        }
    }
    return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
    const pageSize = 100;
    const currentPage = parseInt((req.query.page as string), 10);
    const { device, domain, search, country, sort, tags } = req.query;
    console.log(device, domain, search, country, sort, tags);
    let tagCond = '1=1';
    if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
        tagCond = tagsArray.map((tag) => `JSON_CONTAINS(a.tags, '"${tag}"')`).join(' OR ');
    }

    try {
        let baseQuery = `SELECT a.id as ID,  a.keyword, a.lastResult,  country, device, volume, low_top_of_page_bid, high_top_of_page_bid, lastUpdated, tags, a.history, a.position
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
        and ${tagCond}
        `;
        if (country) {
            const transform = (country as string).split(',').map((i: any) => `'${i}'`).join(',');
            baseQuery = `${baseQuery} and country in (${transform})`;
        }
        const countByDeviceQuery = `select device, count(1) as count from (${baseQuery}) as temp group by device`;

        const processedKeywords: any = [];
        const [total] = await db.query(countByDeviceQuery);
        if (!domain) {
            const [result] = await db.query(`${baseQuery} and device = '${device}' limit ${pageSize} offset ${(currentPage - 1) * pageSize}`);
            result.forEach((r: any) => {
                processedKeywords.push(r);
            });
        } else {
            const [result] = await db.query(`${baseQuery} and device = '${device}'`);
            result.forEach((r: any) => {
                processedKeywords.push(r);
            });
        }
        let finalProcessedKeywords = processedKeywords.map((keyword: any) => {
            const historyArray = Object.keys(keyword.history).map((dateKey: string) => ({
                date: new Date(dateKey).getTime(),
                dateRaw: dateKey,
                position: keyword.history[dateKey],
            }));
            const historySorted = historyArray.sort((a, b) => a.date - b.date);
            const lastWeekHistory: KeywordHistory = {};
            historySorted.slice(-7).forEach((x: any) => { lastWeekHistory[x.dateRaw] = x.position; });
            const keywordWithSlimHistory = { ...keyword, lastResult: [], history: lastWeekHistory };
            // update keyword position based on domain
            if (domain) {
                keywordWithSlimHistory.position = 0;
                const lastResult = JSON.parse(keyword.lastResult);
                lastResult.forEach((r: any) => {
                    if (r.url.includes(domain)) {
                        keywordWithSlimHistory.position = r.position;
                        keywordWithSlimHistory.url = r.url;
                    }
                });
            }
            // const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
            return keywordWithSlimHistory;
        });

        if (domain && sort && sort.includes('pos_')) {
            if (sort === 'pos_asc') {
                finalProcessedKeywords.sort((a: any, b: any) => a.position - b.position);
            } else {
                finalProcessedKeywords.sort((a: any, b: any) => b.position - a.position);
            }
            finalProcessedKeywords = finalProcessedKeywords.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + Math.min(pageSize, finalProcessedKeywords.length - (currentPage - 1) * pageSize));
        }

        // Get all tags of keywords
        const allTags = await getDistinctTagsOfKeywords();

        return res.status(200).json({
            keywords: finalProcessedKeywords,
            count: total.reduce((a: number, b: any) => a + b.count, 0),
            tags: allTags,
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

async function getDistinctTagsOfKeywords() {
    try {
        const distinctTags: { DISTINCT: string }[] = await Keyword.aggregate('tags', 'DISTINCT', { plain: false });

        // Extracting tags from the result
        const distinctTagsArray = distinctTags.map((tagObject) => JSON.parse(tagObject.DISTINCT));

        // Flattening the array of arrays and converting to Set for uniqueness
        const distinctTagsSet = new Set([].concat(...distinctTagsArray));

        // Convert Set to an array to return
        const distinctTagsResult = Array.from(distinctTagsSet);
        return distinctTagsResult;
    } catch (error) {
        console.error('Error fetching distinct tags:', error);
        throw error;
    }
}

const exportCSV = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
    try {
        const { device, domain, search, countries, sort } = req.body;
        let baseQuery = `SELECT a.id as ID,  a.keyword, a.lastResult,  country, device, volume, low_top_of_page_bid as 'PPC Low', high_top_of_page_bid as 'PPC High', lastUpdated, tags, a.history, a.position
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
        const processedKeywords: any = [];
        if (countries.length > 0) {
            const transform = countries.map((i: any) => `'${i}'`).join(',');
            baseQuery = `${baseQuery} and country in (${transform})`;
        }
        const [result] = await db.query(`${baseQuery} and device = '${device}'`);
        result.forEach((r: any) => {
            processedKeywords.push(r);
        });

        const finalProcessedKeywords = processedKeywords.map((keyword: any) => {
            const keywordWithSlimHistory = { ...keyword };
            // update keyword position based on domain
            if (domain) {
                keywordWithSlimHistory.position = 0;
                const lastResult = JSON.parse(keyword.lastResult);
                lastResult.forEach((r: any) => {
                    if (r.url.includes(domain)) {
                        keywordWithSlimHistory.position = r.position;
                        keywordWithSlimHistory.url = r.url;
                    }
                });
            }
            // const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
            return keywordWithSlimHistory;
        });

        if (domain && sort && sort.includes('pos_')) {
            if (sort === 'pos_asc') {
                finalProcessedKeywords.sort((a: any, b: any) => a.position - b.position);
            } else {
                finalProcessedKeywords.sort((a: any, b: any) => b.position - a.position);
            }
        }

        let fields = ['keyword', 'country', 'device', 'volume', 'PPC Low', 'PPC High', 'lastUpdated'];
        if (domain) {
            fields = ['keyword', 'position', 'url', 'country', 'device', 'volume', 'PPC Low', 'PPC High', 'lastUpdated'];
        }
        const opts = { fields };
        const csv = parse(finalProcessedKeywords, opts);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=data.csv');
        return res.status(200).end(csv);
    } catch (error) {
        console.log('Error exporting csv: ', error);
        return res.status(500).json({ error: 'Error exporting csv' });
    }
};
