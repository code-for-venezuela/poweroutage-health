import { NextApiResponse } from 'next';
import axios from 'axios';

const ignoredDevices = ['damp-sky'];

export default async function handler(
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
    const devices = res.data.d[0].owns__device.map((item) => {
      const { is_online, device_name } = item;
      return { is_online, device_name };
    });

    // Check if any device is offline
    const filteredDevices = devices.filter((device) => !ignoredDevices.includes(device.device_name));

    const offlineDevices = filteredDevices.filter((device) => !device.is_online);

    if (offlineDevices.length > 0) {
      // Send notification to Slack channel using webhook integration
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL; 

      const slackMessage = {
        text: 'The following devices are currently offline:',
        attachments: offlineDevices.map((device) => ({
          color: 'danger',
          text: `${device.device_name}`,
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
