import { NotificationChannel } from '../enums/notification-channel.enum';

// Better way could be to have save them in the db instead
// of hardcoding them here, otherwise if we supported another channel
// we will need to push another version of the back-end
const availableChannels = [
  {
    name: 'email',
    description: 'Email channel',
    icon: 'email',
    type: NotificationChannel.EMAIL,
    needsConfiguration: true,
  },
  {
    name: 'sms',
    description: 'SMS channel',
    icon: 'sms',
    type: NotificationChannel.SMS,
    needsConfiguration: true,
  },
  {
    name: 'push',
    description: 'Push channel',
    icon: 'push',
    type: NotificationChannel.PUSH,
    needsConfiguration: true,
  },
  {
    name: 'whatsapp',
    description: 'WhatsApp channel',
    icon: 'whatsapp',
    type: NotificationChannel.WHATSAPP,
    needsConfiguration: true,
  },
  {
    name: 'slack',
    description: 'Slack channel',
    icon: 'slack',
    type: NotificationChannel.SLACK,
    needsConfiguration: true,
  },
];

export default availableChannels;
