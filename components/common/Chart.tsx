import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartDataset } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartProps ={
   labels: string[],
   sreies: (number|null)[],
   backlinks?: (number|null)[],
   reverse? : boolean,
}

const Chart = ({ labels, sreies, reverse = true, backlinks = [] }:ChartProps) => {
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
            displayColors: false,
            callbacks: {
               label: (tooltipItem: any) => {
                  console.log('Function call here', tooltipItem);
                  return [
                     `Label 1: ${tooltipItem.parsed.y}`,
                     `Label 2: ${tooltipItem.parsed.x}`,
                  ];
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
                     // data: backlinks,
                     data: [100, 8, 20, 50],
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
