module.exports = {
  apps: [{
    name: "hot-bot",
    script: "./dist/src/main.js",
    env_production: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    }
  }]
}
