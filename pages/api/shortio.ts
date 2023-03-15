import { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import { isArray } from 'util';
import db from '../../database/database';
import Link from '../../database/models/link';
import LinkStats from '../../database/models/link_stats';
import StatsDomain from '../../database/models/stats_domain';
import verifyUser from '../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const authorized = verifyUser(req, res);
    if (authorized !== 'authorized') {
        return res.status(401).json({ error: authorized });
    }
    if (req.method === 'GET') {
        return updateContent(req, res);
    }
    return res.status(405).json({ message: 'Method not allowed' });
}

const updateContent = async (req: NextApiRequest, res_: NextApiResponse<any>) => {
    // fetch all domains
    const fetchOpts = { method: 'GET', headers: { Authorization: `${process.env.SHORT_API}` } };
    fetch('https://api.short.io/api/domains', fetchOpts)
        .then((res) => res.json())
        .then(async (data) => {
            const statDomains: StatDomainType[] = [];
            const lastUpdated = new Date().toJSON();
            for await (const domain of data) {
                const statDomain: StatDomainType = {
                    ID: domain.id,
                    data: JSON.stringify(domain),
                    last_updated: lastUpdated,
                };
                statDomains.push(statDomain);

                // call links api to get all Links of a domain
                await updateLinksInfo(domain.id);
                await sleep(100);
            }
            const options = {
                updateOnDuplicate: ['data'],
            };
            await StatsDomain.bulkCreate(statDomains, options);
            console.log('[SUCCESS] Updating New Domains from ShortIO successfully ');
            const allLinks = await Link.findAll({ where: { tags: { [Op.like]: '%http%' } } });
            let date = req?.query?.date;
            if (isArray(date)) {
                [date] = date;
            }
            for await (const link of allLinks) {
                await updateLinkStats(link.ID, date ?? null);
                await sleep(100);
            }
            return res_.status(200).json({ message: ' Updating New Domains from ShortIO successfully' });
        })
        .catch((err) => {
            console.log('ERROR Making Daily SHORT IO Cron Request..');
            console.log(err);
            return res_.status(500).json({ message: 'ERROR Making Daily SHORT IO Cron Request..' });
        });
};

const updateLinksInfo = async (domainID: number) => {
    const fetchOpts = { method: 'GET', headers: { Authorization: `${process.env.SHORT_API}` } };
    let hasNextPage = true;
    let nextPageToken = null;
    while (hasNextPage) {
        const data: any = await fetchLinks(domainID, nextPageToken, fetchOpts);
        const links: LinkType[] = [];
        const lastUpdated = new Date().toJSON();
        for (let i = 0; i < data.links.length; i += 1) {
            const link = data.links[i];
            const linkType = {
                ID: link.id,
                tags: JSON.stringify(link.tags),
                data: JSON.stringify(link),
                domain_id: domainID,
                last_updated: lastUpdated,
            };
            links.push(linkType);
        }

        const options = {
            updateOnDuplicate: ['data'],
        };
        await Link.bulkCreate(links, options);
        console.log('[SUCCESS] Updating Links for domain ', domainID);
        if (data.nextPageToken !== null) {
            nextPageToken = data.nextPageToken;
        } else {
            hasNextPage = false;
        }
    }
};

const fetchLinks = async (domainID: number, nextPageToken: string | null, fetchOpts: any) => {
    const response = await fetch(`https://api.short.io/api/links?domain_id=${domainID}&limit=150&${nextPageToken ? `pageToken=${nextPageToken}` : ''}`, fetchOpts);
    if (!response.ok) {
        throw new Error(`Failed to fetch links for domain ${domainID}: ${response.statusText}`);
    }
    return response.json();
};

const updateLinkStats = async (linkId: string, date_: string | null) => {
    let retry = true;
    do {
        const fetchOpts = { method: 'GET', headers: { Authorization: `${process.env.SHORT_API}` } };
        const endDate = date_ ? new Date(date_) : new Date();
        const startDate = endDate.setDate(endDate.getDate() - 1);
        console.log('StartDate: ', date_);
        const res = await fetch(`https://api-v2.short.io/statistics/link/${linkId}?period=total&tzOffset=0&startDate=${startDate}&endDate=${endDate}`, fetchOpts);
        const data = await res.json();
        if ('totalClicks' in data) {
            const stat = {
                totalClicks: data.totalClicks,
                humanClicks: data.humanClicks,
                date: data.interval ? data.interval.startDate.substr(0, 10) : new Date().toJSON().substr(0, 10),
                data: JSON.stringify(data),
                last_updated: new Date().toJSON(),
                link_id: linkId,
            };
            await LinkStats.upsert(stat);
            console.log(`[${new Date().toJSON()}][SUCCESS] Updating Stats for link `, linkId, `https://api-v2.short.io/statistics/link/${linkId}?period=total&tzOffset=0&startDate=${startDate}&endDate=${endDate}`);
            retry = false;
        } else {
            // console.log(`[${new Date().toJSON()}][FAILURE] Updating Stats for link --> Retry `, linkId);
            await sleep(500);
        }
    } while (retry);
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
