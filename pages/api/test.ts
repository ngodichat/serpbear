import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const cr = await import('../../cron');
        console.log(cr, cr.getX());
        cr.tryTest();
        return res.status(200).json({ x: cr.getX() });
    }
    if (req.method === 'PUT') {
        const cr = await import('../../cron');
        console.log(cr, cr.getX());
        cr.tryTest1();
        return res.status(200).json({ x: cr.getX() });
    }
    return res.status(405).json({ message: 'Method not allowed' });
}
