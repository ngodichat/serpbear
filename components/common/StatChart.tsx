import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartProps ={
   labels: string[],
   sreies: (number|null)[],
   reverse? : boolean,
}

const StatChart = ({ labels, sreies, reverse = false}:ChartProps) => {
   const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
         y: {
            reverse,
            min: 0,
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
                  return `${tooltipItem.parsed.y} clicks`;
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

export default StatChart;
