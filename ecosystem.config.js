module.exports = {
  apps : [{
    name: 'API',
    script: 'index.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
	    DATABASEURL: "mongodb://pulpannie:EUwEI6Cm1cEHmRI0@cluster0-shard-00-00-h64sd.mongodb.net:27017,cluster0-shard-00-01-h64sd.mongodb.net:27017,cluster0-shard-00-02-h64sd.mongodb.net:27017/project?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true",
      PORT: '5000'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
