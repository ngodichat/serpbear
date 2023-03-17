import { Sequelize } from 'sequelize-typescript';
// import sqlite3 from 'sqlite3';
import Domain from './models/domain';
import Keyword from './models/keyword';
import Country from "./models/country";
import BackLink from './models/backlink';
import StatsDomain from './models/stats_domain';
import Link from './models/link';
import LinkStatsNew from './models/link_stats_new';

// const connection = new Sequelize({
//    dialect: 'sqlite',
//    host: '0.0.0.0',
//    username: process.env.USERNAME ? process.env.USERNAME : process.env.USER,
//    password: process.env.PASSWORD,
//    database: 'sequelize',
//    dialectModule: sqlite3,
//    pool: {
//       max: 5,
//       min: 0,
//       idle: 10000,
//    },
//    logging: false,
//    models: [Domain, Keyword],
//    storage: './data/database.sqlite',
// });

const connection = new Sequelize({
   dialect: 'mysql',
   dialectModule: require('mysql2'),
   host: process.env.DB_HOST,
   username: 'serpbear',
   password: '8TxnsEr&EusL',
   database: 'serpbear',
      pool: {
      max: 5,
      min: 0,
      idle: 10000,
   },
   logging: false,
   models: [Domain, Keyword, Country, BackLink, StatsDomain, Link, LinkStatsNew],
});

export default connection;
