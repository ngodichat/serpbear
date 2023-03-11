import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartProps ={
   labels: string[],
   sreies: (number|null)[],
   backlinks?: (number|null)[],
   backlinksData?: any,
   reverse? : boolean,
}

const Chart = ({ labels, sreies, reverse = true, backlinks = [], backlinksData = {} }:ChartProps) => {
   const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
         y: {
            reverse,
            min: 1,
            max: reverse ? 100 : undefined,
         },
      },
      plugins: {
         legend: {
             display: false,
         },
         tooltip: {
            displayColors: true,
            callbacks: {
               label: (tooltipItem: TooltipItem<any>) => {
                  if (tooltipItem.datasetIndex === 1) {
                     return `${tooltipItem.parsed.y}`;
                  }
                  console.log(backlinksData);
                  if (backlinksData[tooltipItem.label]) {
                     return backlinksData[tooltipItem.label];
                  }
                  return `${tooltipItem.parsed.y}`;
               },
            },
         },
      },
   };

   return <Line
            datasetIdKey='XXX'
            options={options}
            data ={{
               labels,
               datasets: [
                  {
                     data: backlinks,
                     // data: [100, 8, 20, 50],
                     borderColor: 'transparent',
                     backgroundColor: 'blue',
                  },
                  {
                     fill: 'start',
                     data: sreies,
                     borderColor: 'rgb(31, 205, 176)',
                     backgroundColor: 'rgba(31, 205, 176, 0.5)',
                     spanGaps: true,
                  },
               ],
            }}
         />;
};

export default Chart;
