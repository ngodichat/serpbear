import { NextApiRequest, NextApiResponse } from 'next';
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
        return updateContent(res);
    }
    return res.status(405).json({ message: 'Method not allowed' });
}

const updateContent = async (res_: NextApiResponse<any>) => {
    // fetch all domains
    const fetchOpts = { method: 'GET', headers: { Authorization: `${process.env.SHORT_API}` } };
    fetch('https://api.short.io/api/domains', fetchOpts)
        .then((res) => res.json())
        .then(async (data) => {
            const statDomains: StatDomainType[] = [];
            const lastUpdated = new Date().toJSON();
            data.forEach(async (domain: any) => {
                const statDomain: StatDomainType = {
                    ID: domain.id,
                    data: JSON.stringify(domain),
                    last_updated: lastUpdated,
                };
                statDomains.push(statDomain);

                // call links api to get all Links of a domain
                await updateLinksInfo(domain.id);
            });
            const options = {
                updateOnDuplicate: ['data'],
            };
            await StatsDomain.bulkCreate(statDomains, options);
            console.log('[SUCCESS] Updating New Domains from ShortIO successfully ');
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
    let count = 0;
    // while (hasNextPage) {
        const data: any = await fetchLinks(domainID, nextPageToken, fetchOpts);
        const links: LinkType[] = [];
        const lastUpdated = new Date().toJSON();
        data.links.forEach(async (link: any) => {
            const linkType = {
                ID: link.id,
                tags: JSON.stringify(link.tags),
                data: JSON.stringify(link),
                domain_id: domainID,
                last_updated: lastUpdated,
            };
            links.push(linkType);
            setTimeout(() => {
                if (count < 1) {
                    updateLinkStats(link.id);
                }
                count += 1;
            }, 5000);
        });
        const options = {
            updateOnDuplicate: ['data'],
        };
        await Link.bulkCreate(links, options);
        console.log('[SUCCESS] Updating Links for domain ', domainID);
        if (data.nextPageToken !== null) {
            nextPageToken = data.nextPageToken;
        } else {
            hasNextPage = false;
            console.log(hasNextPage);
        }
    // }
};

const fetchLinks = async (domainID: number, nextPageToken: string | null, fetchOpts: any) => {
    const response = await fetch(`https://api.short.io/api/links?domain_id=${domainID}&limit=150&${nextPageToken ? `pageToken=${nextPageToken}` : ''}`, fetchOpts);
    if (!response.ok) {
        throw new Error(`Failed to fetch links for domain ${domainID}: ${response.statusText}`);
    }
    return response.json();
};

const updateLinkStats = async (linkId: string) => {
    const fetchOpts = { method: 'GET', headers: { Authorization: `${process.env.SHORT_API}` } };
    const startDate = new Date().valueOf();
    console.log('StartDate: ', startDate);
    fetch(`https://api-v2.short.io/statistics/link/${linkId}?period=total&tzOffset=0&startDate=${startDate}&endDate=${startDate}`, fetchOpts)
        .then((res) => res.json())
        .then(async (data) => {
            const stat = {
                totalClicks: data.totalClicks,
                humanClicks: data.humanClicks,
                date: data.interval ? data.interval.startDate : new Date().toJSON(),
                data: JSON.stringify(data),
                last_updated: new Date().toJSON(),
                link_id: linkId,
            };
            await LinkStats.create(stat);
            console.log('[SUCCESS] Updating Stats for link ', linkId);
        })
        .catch((err) => {
            console.log('ERROR Updating Stats for link:  ', linkId);
            console.log(err);
        });
};
