import { NextApiRequest, NextApiResponse } from 'next';

import { getX, tryTest, stop } from '../../cron';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        console.log(getX());
        tryTest();
        return res.status(200).json({ x: getX() });
    }
    if (req.method === 'PUT') {
        console.log(getX());
        stop();
        return res.status(200).json({ x: getX() });
    }
    return res.status(405).json({ message: 'Method not allowed' });
}
