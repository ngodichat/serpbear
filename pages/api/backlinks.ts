import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import csv from 'csv-parser';
import fs from 'fs';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import BackLink from '../../database/models/backlink';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await db.sync();
  const authorized = verifyUser(req, res);
  if (authorized !== 'authorized') {
    res.status(401).json({ error: authorized });
  }

  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files: Record<string, any>) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Error parsing form data' });
      }

      if (!files || !files.csv) {
        res.status(400).json({ message: 'CSV file is required' });
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
            };
            records.push(record);
          });

          try {
            const options = {
              updateOnDuplicate: ['anchor_text', 'source_trust_flow', 'source_citation_flow', 'domain_trust_flow', 'domain_citation_flow', 'link_first_index_date'],
            };
            await BackLink.bulkCreate(records, options);
            res.status(200).json({ message: 'Upload file successfully' });
          } catch (error) {
            console.log('[ERROR] Adding New Backlinks ', error);
            res.status(400).json({ error: 'Could Not Add New Backlinks!' });
          }
        });
      // fs.createReadStream(files.csv.path).on('data', (data) => console.log(data));
      // console.log('files.csv.path: ', files.csv.filepath);
      // const fileStream = fs.createReadStream(files.csv.filepath);
      // fileStream.on('data', (data) => console.log(data));
      // fileStream.close();
      // fs.readFile(files.csv.path, (error, data) => {
      //   if (error) throw error;
      //   console.log(data);
      // });
      // res.status(200).json({ message: 'API POST endpoint reached' });
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
