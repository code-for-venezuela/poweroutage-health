import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { cursor, take, deviceIds } = req.query;
    let deviceIdsArray: string[] = []
    if (deviceIds !== undefined) {
        deviceIdsArray = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
    }


    // Default pagination settings
    const takeNumber = parseInt(take as string) || 10; // Number of items per page
    let cursorDate: Date | undefined = undefined;
    // Defensive programming: Safely parse the cursor as a Date object
    if (cursor) {
        try {
            const parsedDate = new Date(cursor as string);
            if (!isNaN(parsedDate.getTime())) {
                cursorDate = parsedDate;
            }
        } catch (error) {
            console.error('Invalid date format for cursor:', error);
            cursorDate = undefined;
        }
    }
    try {
        const events = await prisma.event.findMany({
            where: {
                eventType: 'power_outage_probe', // Filter by the correct event type
                createdAt: cursorDate ? { lt: cursorDate } : undefined, // Paginate by createdAt with lt (less than) condition
                ...(deviceIdsArray.length > 0 ? {
                    OR: deviceIdsArray.map(id => ({
                        payload: {
                            path: 'device_id',
                            equals: id
                        }
                    }))
                } : {}),
            },
            orderBy: {
                createdAt: 'desc', // Order by createdAt descending for newest first
            },
            take: takeNumber,
        });

        const nextCursor = events.length === takeNumber ? events[events.length - 1].createdAt.toISOString() : null;

        res.status(200).json({ events, nextCursor });
    } catch (error) {
        console.error(`Error fetching data from db: ${error}`)
        res.status(500).json({ error: 'Something went wrong.' });
    }
}