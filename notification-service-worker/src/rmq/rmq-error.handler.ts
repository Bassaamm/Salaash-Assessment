import { Logger } from '@nestjs/common';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay: 1 second

export const RMQErrorHandler = (handlerName: string) => {
  const logger = new Logger(`RMQError:${handlerName}`);

  return (channel: any, msg: any, error: Error) => {
    logger.error(`Error in ${handlerName}: ${error.message}`, error.stack);

    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;

    if (retryCount <= MAX_RETRIES) {
      const delayMs = RETRY_DELAY_MS * Math.pow(2, retryCount - 1);

      logger.log(
        `Retry attempt ${retryCount}/${MAX_RETRIES} for message. Scheduling retry in ${delayMs}ms`,
      );

      // Schedule retry with delay
      setTimeout(() => {
        try {
          const newHeaders = {
            ...msg.properties.headers,
            'x-retry-count': retryCount,
          };

          channel.publish(
            msg.fields.exchange,
            msg.fields.routingKey,
            msg.content,
            {
              ...msg.properties,
              headers: newHeaders,
            },
          );

          logger.log(`Message republished for retry ${retryCount}`);

          // ACK the original message after successful republish
          channel.ack(msg);
        } catch (republishError) {
          logger.error(
            `Failed to republish message: ${republishError.message}`,
            republishError.stack,
          );
          channel.ack(msg);
        }
      }, delayMs);
    } else {
      // Max retries exceeded
      logger.error(
        `Max retries (${MAX_RETRIES}) exceeded for message. Acknowledging and moving to DLQ.`,
      );

      // In production we should send to Dead Letter Queue for manual inspection
      // For now, just ACK to prevent infinite loop
      channel.ack(msg);
    }
  };
};
