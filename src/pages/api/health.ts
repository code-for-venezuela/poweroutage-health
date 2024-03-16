import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'

import axios from 'axios';

const prisma = new PrismaClient()
const ignoredDevices = ['nameless-zombie', 'morning-apple', 'frosty-desert'];

type BalenaDeviceStatus = {
  name: string,
  isOnline: boolean;
};

type BalenaDeviceStatus24hReport = {
  name: string,
  offlineCount: number,
};

export default async function handler(
  _: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    // Make a GET request to the balena.io fleet API endpoint
    const res = await axios.get(`https://api.balena-cloud.com/v6/application(${process.env.BALENA_APP_ID})?\$expand=owns__device`, {
      headers: {
        Authorization: `Bearer ${process.env.BALENA_API_BEARER}`,
      },
    });

    // Extract the device information from the response
    const devices = res.data.d[0].owns__device.map((item: { is_online: string; device_name: boolean; }) => {
      const { is_online, device_name } = item;
      return { isOnline: is_online, name: device_name };
    });

    const isRecent = await checkHeartbeat();


    if (!isRecent) {
      await saveDeviceStatuses(devices)
    }

    const last24hReport = await getFrequentOfflineDevices()
    console.log("last 24hours report:", last24hReport)

    // Check if any device is offline
    const filteredDevices = last24hReport.filter((device: BalenaDeviceStatus24hReport) => !ignoredDevices.includes(device.name));
    const offlineDevices = filteredDevices.filter((device: BalenaDeviceStatus24hReport) => device.offlineCount >= 3);
    //const onlineDevices = filteredDevices.filter((device:Device) => device.isOnline);

    if (offlineDevices.length > 0) {
      // Send notification to Slack channel using webhook integration
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || '';

      const slackMessage = {
        text: 'The following devices have been offline in the last 24 hours:',
        attachments: offlineDevices.map((device: BalenaDeviceStatus24hReport) => ({
          color: 'danger',
          text: `${device.name} has been offline ${device.offlineCount} times in the last 24 hours`,
        })),
      };

      if (!isRecent) {
        await axios.post(slackWebhookUrl, slackMessage);
      }
    }

    const responseBody = {
      devices: devices,
      last24hReport: last24hReport,
    };

    await prisma.$disconnect()
    response.setHeader('Content-Type', 'application/json');
    response.status(200).json(responseBody);
  } catch (error) {
    console.error('Error retrieving devices from balena.io:', error);
    response.status(500).json({ error: 'An error occurred while retrieving devices.' });
    await prisma.$disconnect()
  }
}

async function saveDeviceStatuses(deviceStatus: BalenaDeviceStatus[]) {
  try {
    await prisma.$transaction(async (prisma) => {
      // Perform all database operations within this transaction
      for (const device of deviceStatus) {
        await prisma.deviceStatus.create({
          data: {
            deviceId: device.name, // Assuming 'name' is used as 'deviceId'
            healthStatus: device.isOnline ? 'ONLINE' : 'OFFLINE',
          },
        });
      }
      // Update heartbeat within the same transaction
    });
    await updateHeartbeat();
    console.log("successfully persisted devices")
  } catch (error) {
    console.error("Error inserting rows to the databse:", error)
  }
}

async function getFrequentOfflineDevices(): Promise<BalenaDeviceStatus24hReport[]> {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT deviceId as name, COUNT(*) as offlineCount
      FROM DeviceStatus
      WHERE healthStatus = 'OFFLINE'
      AND createdAt >= NOW() - INTERVAL 36 HOUR
      GROUP BY deviceId
    `;

    return result.map(row => {
      return {
        name: row.name,
        offlineCount: typeof row.offlineCount === 'bigint' ? Number(row.offlineCount) : row.offlineCount,
      };
    });
  } catch (error) {
    console.error("Error querying frequent offline devices:", error);
    return [];
  }
}

async function updateHeartbeat() {
  try {
    await prisma.heartbeat.upsert({
      where: { id: 1 },
      update: {
        updatedAt: new Date(),
      },
      create: { id: 1 },
    });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
  }
}

async function checkHeartbeat() {
  const heartbeat = await prisma.heartbeat.findUnique({
    where: { id: 1 },
  });

  if (heartbeat) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    if (heartbeat.updatedAt > sixHoursAgo) {
      console.log("Heartbeat is within the last 6 hours. Skipping generating more statuses");
      return true;
    } else {
      console.log("Heartbeat is older than 6 hours.");
      return false;
    }
  } else {
    console.log("Heartbeat row does not exist.");
    return false;
  }
}