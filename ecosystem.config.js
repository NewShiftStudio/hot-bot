module.exports = {
  apps: [
    {
      name: 'est1993-bot',
      script: 'dist/src/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
    },
  ],
};
