import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import csv from 'csv-parser';
import fs from 'fs';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import BackLink from '../../database/models/backlink';
import Domain from '../../database/models/domain';

type BacklinksGetResponse = {
  backlinks?: BackLink[],
  error?: string | null,
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await db.sync();
  const authorized = verifyUser(req, res);
  if (authorized !== 'authorized') {
    return res.status(401).json({ error: authorized });
  }

  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files: Record<string, any>) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      if (!files || !files.csv) {
        return res.status(400).json({ message: 'CSV file is required' });
      }

      const results: any[] = [];
      fs.createReadStream(files.csv.filepath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          const records: any[] = [];
          const urlKey = Object.keys(results[0])[0];
          results.forEach((row) => {
            // console.log(row);
            const record = {
              URL: row[urlKey],
              anchor_text: row['Anchor Text'],
              source_trust_flow: parseInt(row['Source Trust Flow'], 10),
              source_citation_flow: parseInt(row['Source Citation Flow'], 10),
              domain_trust_flow: parseInt(row['Domain Trust Flow'], 10),
              domain_citation_flow: row['Domain Citation Flow'],
              link_first_index_date: row['Link First Indexed Date'],
              domain: row['Target URL'],
            };
            records.push(record);
          });

          try {
            const options = {
              updateOnDuplicate: ['anchor_text', 'source_trust_flow', 'source_citation_flow', 'domain_trust_flow', 'domain_citation_flow', 'link_first_index_date'],
            };
            await BackLink.bulkCreate(records, options);
            console.log('[SUCCESS] Adding New Backlinks successfully ');
            return res.status(200).json({ message: 'Upload file successfully' });
          } catch (error) {
            console.log('[ERROR] Adding New Backlinks ', error);
            return res.status(400).json({ error: 'Could Not Add New Backlinks!' });
          }
        });
        return null;
    });
  }
  if (req.method === 'GET') {
    return getBacklinks(req, res);
  }
  return res.status(405).json({ message: 'Method not allowed' });
}

const getBacklinks = async (req: NextApiRequest, res: NextApiResponse<BacklinksGetResponse>) => {
  if (!req.query.domain && typeof req.query.domain !== 'string') {
    return res.status(400).json({ error: 'Domain is Required!' });
  }
  const domainreq = (req.query.domain as string).toLowerCase();
  const domainObj: Domain | null = await Domain.findOne({ where: { slug: domainreq } });
  if (domainObj === null) return res.status(400).json({ error: 'Domain not found!' });
  const { domain } = domainObj;
//   try {
//     const allKeywords: BackLink[] = await BackLink.findAll({ where: { domain } });
//     const keywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
//     const processedKeywords = keywords.map((keyword) => {
//        const historyArray = Object.keys(keyword.history).map((dateKey: string) => ({
//           date: new Date(dateKey).getTime(),
//           dateRaw: dateKey,
//           position: keyword.history[dateKey],
//        }));
//        const historySorted = historyArray.sort((a, b) => a.date - b.date);
//        const lastWeekHistory: KeywordHistory = {};
//        historySorted.slice(-7).forEach((x: any) => { lastWeekHistory[x.dateRaw] = x.position; });
//        const keywordWithSlimHistory = { ...keyword, lastResult: [], history: lastWeekHistory };
//        const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
//        return finalKeyword;
//     });
//     return res.status(200).json({ keywords: processedKeywords });
//  } catch (error) {
//     console.log('[ERROR] Getting Domain Keywords for ', domain, error);
//     return res.status(400).json({ error: 'Error Loading Keywords for this Domain.' });
//  }

  return res.status(200).json({ error: `Get backlinks successfully! ${domain}` });
};
