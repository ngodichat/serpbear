type ChartData = {
   labels: string[],
   sreies: (number | null)[],
   backlinks?: (number | null)[],
   backlinksData?: any,
}

export const generateChartData = (history: KeywordHistory): ChartData => {
   const currentDate = new Date();
   const priorDates = [];
   const seriesDates: any = {};
   let lastFoundSerp = 0;

   // First Generate Labels. The labels should be the last 30 days dates. Format: Oct 26
   for (let index = 30; index >= 0; index -= 1) {
      const pastDate = new Date(new Date().setDate(currentDate.getDate() - index));
      priorDates.push(`${pastDate.getDate()}/${pastDate.getMonth() + 1}`);

      // Then Generate Series. if past date's serp does not exist, use 0.
      // If have a missing serp in between dates, use the previous date's serp to fill the gap.
      const pastDateKey = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`;
      const serpOftheDate = history[pastDateKey];
      const lastLargestSerp = lastFoundSerp > 0 ? lastFoundSerp : 0;
      seriesDates[pastDateKey] = history[pastDateKey] ? history[pastDateKey] : lastLargestSerp;
      if (lastFoundSerp < serpOftheDate) { lastFoundSerp = serpOftheDate; }
   }

   return { labels: priorDates, sreies: Object.values(seriesDates) };
};

export const generateTheChartData = (history: KeywordHistory, time: string = '30', backlinks: BacklinkType[] = []): ChartData => {
   const currentDate = new Date(); let lastFoundSerp = 0;
   const chartData: ChartData = { labels: [], sreies: [], backlinks: [], backlinksData: {} };
   // group backlinks by date
   const backlinksByDate: any = {};
   backlinks.forEach((bl: BacklinkType) => {
      const dateParts = bl.link_first_index_date.replace(' 00:00', '').split('/');
      console.log('dateParts: ', dateParts);
      const year = parseInt(dateParts[2], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[0], 10);
      const dateObj = `${year}-${month}-${day}`;
      if (!(dateObj in backlinksByDate)) {
         backlinksByDate[dateObj] = [];
      }
      backlinksByDate[dateObj].push(`(TF ${bl.domain_trust_flow}) ${bl.URL}`);
   });
   console.log('backlinks by date: ', backlinksByDate);
   if (time === 'all') {
      Object.keys(history).forEach((dateKey) => {
         const serpVal = history[dateKey] ? history[dateKey] : 111;
         chartData.labels.push(dateKey);
         chartData.sreies.push(serpVal);
      });
   } else {
      // First Generate Labels. The labels should be the last 30 days dates. Format: Oct 26
      for (let index = parseInt(time, 10); index >= 0; index -= 1) {
         const pastDate = new Date(new Date().setDate(currentDate.getDate() - index));
         // Then Generate Series. if past date's serp does not exist, use 0.
         // If have a missing serp in between dates, use the previous date's serp to fill the gap.
         const pastDateKey = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`;
         const prevSerp = history[pastDateKey];
         const serpVal = prevSerp || (lastFoundSerp > 0 ? lastFoundSerp : null);
         if (serpVal !== 0) { lastFoundSerp = prevSerp; }
         chartData.labels.push(pastDateKey);
         chartData.sreies.push(serpVal);
         if (pastDateKey in backlinksByDate) {
            chartData.backlinks!.push(100);
            chartData.backlinksData[pastDateKey] = backlinksByDate[pastDateKey];
         } else {
            chartData.backlinks!.push(null);
         }
      }
   }
   return chartData;
};

export const generateStatChartData = (linkStats: any, time: string = '30'): ChartData => {
   const chartData: ChartData = { labels: [], sreies: [] };
   if (linkStats) {
      const currentDate = new Date();
      console.log('link stats: ', linkStats);
      if (time === 'all') {
         Object.keys(linkStats).forEach((dateKey) => {
            const serpVal = linkStats[dateKey] ? linkStats[dateKey] : 111;
            chartData.labels.push(dateKey);
            chartData.sreies.push(serpVal);
         });
      } else {
         // First Generate Labels. The labels should be the last 30 days dates. Format: Oct 26
         for (let index = parseInt(time, 10); index >= 0; index -= 1) {
            const pastDate = new Date(new Date().setDate(currentDate.getDate() - index));
            // Then Generate Series. if past date's serp does not exist, use 0.
            // If have a missing serp in between dates, use the previous date's serp to fill the gap.
            const pastDateKey = `${pastDate.getFullYear()}-${(pastDate.getMonth() + 1) > 9 ? (pastDate.getMonth() + 1) : `0${(pastDate.getMonth() + 1)}`}-${pastDate.getDate()}`;
            const serpVal = linkStats[pastDateKey];
            chartData.labels.push(pastDateKey);
            chartData.sreies.push(serpVal);
         }
      }
      console.log('chartData: ', chartData);
   }
   return chartData;
};
