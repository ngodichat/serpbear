const Cryptr = require('cryptr');
const { promises } = require('fs');
const { readFile } = require('fs');
const cron = require('node-cron');
const fetch = require('isomorphic-fetch');
require('dotenv').config({ path: './.env.local' });

let refreshCron = null;

const getAppSettings = async () => {
   const defaultSettings = {
      scraper_type: 'none',
      notification_interval: 'never',
      notification_email: '',
      smtp_server: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
   };
   // console.log('process.env.SECRET: ', process.env.SECRET);
   try {
      let decryptedSettings = {};
      const exists = await promises.stat(`${process.cwd()}/data/settings.json`).then(() => true).catch(() => false);
      if (exists) {
         const settingsRaw = await promises.readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
         const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

         try {
            const cryptr = new Cryptr(process.env.SECRET);
            const scaping_api = settings.scaping_api ? cryptr.decrypt(settings.scaping_api) : '';
            const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
            decryptedSettings = { ...settings, scaping_api, smtp_password };
         } catch (error) {
            console.log('Error Decrypting Settings API Keys!');
         }
      } else {
         console.log('Setting file not found');
         throw Error('Settings file dont exist.');
      }
      return decryptedSettings;
   } catch (error) {
      console.log('CRON ERROR: Reading Settings File. ', error);
      try {
         await promises.access(`${process.cwd()}/data`);
         await promises.writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(defaultSettings), { encoding: 'utf-8' });
         return defaultSettings;
      } catch (err) {
         if (err.code === 'ENOENT') {
            // directory does not exist, so create it
            await promises.mkdir(`${process.cwd()}/data`, { recursive: true });
            await promises.writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(defaultSettings), { encoding: 'utf-8' });
            return defaultSettings;
         } else {
            // some other error occurred
            throw err;
         }
      }
   }
};

const generateCronTime = (interval) => {
   let cronTime = false;
   if (interval === 'hourly') {
      cronTime = '0 0 */1 * * *';
   }
   else if (interval === 'daily') {
      cronTime = '0 0 0 * * *';
   }
   else if (interval === 'daily_morning') {
      cronTime = '0 0 1 * * *';
   }
   else if (interval === 'weekly') {
      cronTime = '0 0 0 */7 * *';
   }
   else if (interval === 'monthly') {
      cronTime = '0 0 1 * *'; // Run every first day of the month at 00:00(midnight)
   } else if (interval === 'minute') {
      cronTime = '* * * * *';
   } else if (interval === '2-minute') {
      cronTime = '*/2 * * * *';
   }

   return cronTime;
};

const generateCronTimeByHours = (hours) => {
   if (hours <= 0) {
      throw new Error('Invalid input. Hours must be a positive number.');
   }

   let expression;

   if (hours <= 24) {
      // For input values up to 24, construct the cron expression as before
      const minutes = 0;
      expression = `0 ${minutes} */${hours} * * *`;
   } else {
      // For larger input values, break the expression into two parts
      const remainder = hours % 24;
      const days = Math.floor(hours / 24);

      // Construct the first part of the expression to run once per day
      const minutes = 0;
      const hoursOfDay = '*';
      const daysOfMonth = `*/${days}`;
      const month = '*';
      const dayOfWeek = '?';
      const part1 = `0 ${minutes} ${hoursOfDay} ${daysOfMonth} ${month} ${dayOfWeek}`;

      // Construct the second part of the expression to run every {remainder} hours
      const minutes2 = 0;
      const hours2 = `*/${remainder}`;
      const part2 = `${minutes2} ${hours2} * * * *`;

      // Combine the two parts into a single expression
      expression = `${part1}\n${part2}`;
   }

   return expression;
}

const runAppCronJobs = () => {
   // RUN SERP Scraping CRON (EveryDay at Midnight) 0 0 0 * *
   const scrapeCronTime = generateCronTime('daily');
   // const scrapeCronTime = generateCronTime('minute');
   console.log('runAppCronJobs: ', scrapeCronTime);

   // Run Failed scraping CRON (Every Hour)
   const failedCronTime = generateCronTime('hourly');
   cron.schedule(failedCronTime, async () => {
      // console.log('### Retrying Failed Scrapes...');
      await promises.appendFile(`${process.cwd()}/logs/keyword_cron.txt`, `${JSON.stringify(new Date())} - Retrying Failed Scrapes...\n`, { encoding: 'utf-8' });
      readFile(`${process.cwd()}/data/failed_queue.json`, { encoding: 'utf-8' }, (err, data) => {
         if (data) {
            const keywordsToRetry = data ? JSON.parse(data) : [];
            if (keywordsToRetry.length > 0) {
               const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
               fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refresh?id=${keywordsToRetry.join(',')}`, fetchOpts)
                  .then((res) => res.json())
                  .then((refreshedData) => console.log(refreshedData))
                  .catch((fetchErr) => {
                     console.log('ERROR Making failed_queue Cron Request..');
                     console.log(fetchErr);
                  });
            }
         } else {
            console.log('ERROR Reading Failed Scrapes Queue File..', err);
         }
      });
   }, { scheduled: true });

   // Run Google Search Console Scraper Daily
   if (process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL) {
      const searchConsoleCRONTime = generateCronTime('daily');
      cron.schedule(searchConsoleCRONTime, async () => {
         const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
         await promises.appendFile(`${process.cwd()}/data/searchconsole.txt`, `${JSON.stringify(new Date())} - Running Google Search Console Scraper\n`, { encoding: 'utf-8' });
         fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/searchconsole`, fetchOpts)
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => {
               console.log('ERROR Making Google Search Console Scraper Cron Request..');
               console.log(err);
            });
      }, { scheduled: true });
   }

   // RUN Email Notification CRON
   getAppSettings().then((settings) => {
      const notif_interval = (!settings.notification_interval || settings.notification_interval === 'never') ? false : settings.notification_interval;
      if (notif_interval) {
         const cronTime = generateCronTime(notif_interval === 'daily' ? 'daily_morning' : notif_interval);
         if (cronTime) {
            cron.schedule(cronTime, () => {
               // console.log('### Sending Notification Email...');
               const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
               fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, fetchOpts)
                  .then((res) => res.json())
                  .then((data) => console.log(data))
                  .catch((err) => {
                     console.log('ERROR Making Cron Email Notification Request..');
                     console.log(err);
                  });
            }, { scheduled: true });
         }
      }
      const scraping_frequency = (!settings.scraping_frequency || settings.scraping_frequency === 'never') ? 24 : settings.scraping_frequency;
      console.log('scraping_frequency in setting file: ', scraping_frequency);
      if (scraping_frequency) {
         updateScrapeFrequency(scraping_frequency);
      }
   });
};

const runShortIOCronJobs = () => {
   const scrapeCronTime = generateCronTime('daily_morning');
   // const scrapeCronTime = generateCronTime('minute');
   console.log('runShortIOCronJobs: ', scrapeCronTime);
   cron.schedule(scrapeCronTime, async () => {
      console.log('### Running Cron Job to Update ShortIO content!');
      await promises.appendFile(`${process.cwd()}/data/shortio_cron.txt`, `${JSON.stringify(new Date())} - Running Cron Job to Update ShortIO content\n`, { encoding: 'utf-8' });
      const fetchOpts = { method: 'GET', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
      try {
         fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shortio`, fetchOpts)
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => {
               console.log('ERROR Making Daily SHORT IO Cron Request..');
               console.log(err);
            });
      } catch (error) {
         console.log(error);
      };
   }, { scheduled: true });
}

runAppCronJobs();

runShortIOCronJobs();

const updateScrapeFrequency = (scraping_frequency) => {
   console.log('Running updateScrapeFrequency');
   const scrape = cron.getTasks().get('scrape');
   if (scrape) {
      console.log('Stopping old scheduler');
      scrape.stop();
   }
   if (scraping_frequency > 0) {
      const cronTime = generateCronTimeByHours(scraping_frequency);
      // const cronTime = generateCronTime('minute');
      cron.schedule(cronTime, async () => {
         console.log('### Running Keyword Position Cron Job!', `${process.env.NEXT_PUBLIC_APP_URL}/api/cron`);
         const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
         try {
            await promises.appendFile(`${process.cwd()}/data/keyword_cron.txt`, `${JSON.stringify(new Date())} - Running Keyword Position\n`, { encoding: 'utf-8' });
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron`, fetchOpts)
               .then((res) => res.json())
               .then((data) => console.log(data))
               .catch((err) => {
                  console.log('ERROR Making Daily Scraper Cron Request..');
                  console.log(err);
               });
         } catch (error) {
             console.log(error);
         };
      }, { scheduled: true, name: 'scrape' });
   }
}

const startCron = () => {
   console.log('Cron started');
}

module.exports = {
   updateScrapeFrequency,
   startCron
};