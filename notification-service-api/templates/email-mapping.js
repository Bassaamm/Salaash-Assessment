// Email template mapping: HTML file name -> template code
exports.emailMapping = {
  'order-created.html': 'order-created',
  'generic-notification.html': 'generic-notification',
  // Add more mappings as you create more templates
};

// Required variables for each template
exports.templateVariables = {
  'order-created': ['orderNumber', 'price', 'notes'],
  'generic-notification': ['message'],
};

// Template metadata
exports.templateMetadata = {
  'order-created': {
    from_name: 'Order Team',
    reply_to: 'orders@example.com',
    category: 'transactional',
    description: 'Sent when an order is created',
  },
  'generic-notification': {
    from_name: 'Notification Service',
    reply_to: 'noreply@example.com',
    category: 'notification',
    description: 'Generic notification email',
  },
};
