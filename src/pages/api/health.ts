import {NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const ignoredDevices = ['damp-sky'];

type Device = {
  name: string,
  isOnline: boolean;
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

    // Check if any device is offline
    const filteredDevices = devices.filter((device:Device) => !ignoredDevices.includes(device.name));

    const offlineDevices = filteredDevices.filter((device:Device) => !device.isOnline);

    if (offlineDevices.length > 0) {
      // Send notification to Slack channel using webhook integration
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || ''; 

      const slackMessage = {
        text: 'The following devices are currently offline:',
        attachments: offlineDevices.map((device:Device) => ({
          color: 'danger',
          text: `${device.name}`,
        })),
      };

      await axios.post(slackWebhookUrl, slackMessage);
    }

    const responseBody = {
      devices: devices,
    };

    response.setHeader('Content-Type', 'application/json');
    response.status(200).json(responseBody);
  } catch (error) {
    console.error('Error retrieving devices from balena.io:', error);
    response.status(500).json({ error: 'An error occurred while retrieving devices.' });
  }
}
