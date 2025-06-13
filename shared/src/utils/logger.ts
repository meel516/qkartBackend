import winston from 'winston';

const createLogger = (serviceName: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const logEntry = {
          timestamp,
          level,
          service: service || serviceName,
          message,
          ...meta
        };
        return JSON.stringify(logEntry);
      })
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({ 
        filename: `logs/${serviceName}-error.log`, 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: `logs/${serviceName}.log` 
      })
    ]
  });
};

export { createLogger };