module.exports = {
  apps: [
    {
      name: 'redalert-shelter-bot',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1, // Must be 1 - WhatsApp allows only one connection
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
