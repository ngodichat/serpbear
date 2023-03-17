import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import Settings from '../../components/settings/Settings';
import { useFetchSettings } from '../../services/settings';
import { useFetchDomains } from '../../services/domains';
import DomainItem from '../../components/domains/DomainItem';
import Icon from '../../components/common/Icon';
import { useFetchKeywordsStats } from '../../services/keywords';
import StatChart from '../../components/common/StatChart';
import { generateStatChartData } from '../../components/common/generateChartData';
import { useFetchLinkStats } from '../../services/shortio';
import SelectField from '../../components/common/SelectField';
import { useQueryClient } from 'react-query';

const SingleDomain: NextPage = () => {
   const router = useRouter();
   const queryClient = useQueryClient();
   const [noScrapprtError, setNoScrapprtError] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const { data: appSettings } = useFetchSettings();
   const { stats } = useFetchKeywordsStats(router);
   const [chartTime, setChartTime] = useState<string>('30');
   const { linkStatsData } = useFetchLinkStats(router, chartTime);
   const dateOptions = [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days', value: '90' },
      { label: '1 Year', value: '360' },
      { label: 'All Time', value: 'all' },
   ];
   const { data: domainsData, isLoading } = useFetchDomains(router, chartTime, true);

   useEffect(() => {
      console.log('Domains Data: ', domainsData);
      queryClient.invalidateQueries(['domains', 'linkstats']);
   }, [chartTime]);

   useEffect(() => {
      console.log('Keywords Data: ', stats);
   }, [stats]);

   useEffect(() => {
      // console.log('appSettings.settings: ', appSettings && appSettings.settings);
      if (appSettings && appSettings.settings && (!appSettings.settings.scraper_type || (appSettings.settings.scraper_type === 'none'))) {
         setNoScrapprtError(true);
      }
   }, [appSettings]);

   const linkStats = linkStatsData && linkStatsData.stats;
   const chartData = useMemo(() => {
      return generateStatChartData(linkStats, chartTime);
   }, [linkStats, chartTime]);

   return (
      <div className="Domain ">
         {noScrapprtError && (
            <div className=' p-3 bg-red-600 text-white text-sm text-center'>
               A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
            </div>
         )}
         <Head>
            <title>Domains - Clickhub</title>
         </Head>
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} showAddDomainModal={() => setShowAddDomain(true)} />

         <div className="flex flex-col w-full max-w-5xl mx-auto p-6 lg:mt-24 lg:p-0">
            <div className='stat-chart hidden lg:block domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-8'>
               <span className='domKeywords_filters py-4 px-6 flex justify-between text-sm text-gray-500 font-semibold border-b-[1px] lg:flex-row'>
                  <span>Stats</span>
                  <div className='flex items-center'>
                     <Icon type="date" />
                     <div className="keywordDetails__section__chart_select ml-3">
                        <SelectField
                           options={dateOptions}
                           selected={[chartTime]}
                           defaultLabel="Select Date"
                           updateField={(updatedTime: [string]) => setChartTime(updatedTime[0])}
                           multiple={false}
                           rounded={'rounded'}
                        />
                     </div>
                  </div>
               </span>
               <span className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                  <span className='ml-4 mt-4 p-4 flex flex-col bg-[white] rounded-md text-sm border mb-8 w-fit'>
                     <span className='font-semibold text-lg'>Total Clicks</span>
                     <span className='text-[#1ECDB0] text-2xl'>{chartData.sreies.reduce((a: number, b: any) => (a + parseInt(b ?? 0, 10)), 0)}</span>
                  </span>
                  <div className='keywordDetails__section__chart h-64'>
                     <StatChart labels={chartData.labels} sreies={chartData.sreies} />
                  </div>
               </span>
            </div>
            <div className='flex justify-between mb-2 items-center'>
               <div className='flex'>
                  <div className=' text-sm border-r-2 pr-2'>{domainsData?.domains?.length || 0} Domains</div>
                  <div className=' text-sm border-r-2 px-2'>{domainsData?.domains.reduce((a: number, b: any) => (a + b.keywordCount), 0) || 0} Keywords</div>
                  <div className=' text-sm border-r-2 px-2'>{stats?.desktop || 0} Desktop</div>
                  <div className=' text-sm px-2'>{stats?.mobile || 0} Mobile</div>
               </div>
               <div>
                  <button
                     className={'ml-2 inline-block py-2 text-blue-700 font-bold text-sm'}
                     onClick={() => setShowAddDomain(true)}>
                     <span
                        className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                     <i className=' not-italic hidden lg:inline-block'>Add Domain</i>
                  </button>
               </div>
            </div>
            <div className='flex w-full flex-col mb-8'>
               {domainsData?.domains && domainsData.domains.map((domain: DomainType) => {
                  return <DomainItem
                     key={domain.ID}
                     domain={domain}
                     selected={false}
                     isConsoleIntegrated={!!(appSettings && appSettings?.settings?.search_console_integrated)}
                  // isConsoleIntegrated={false}
                  />;
               })}
               {isLoading && (
                  <div className='noDomains mt-4 p-5 py-12 rounded border text-center bg-white text-sm'>
                     <Icon type="loading" /> Loading Domains...
                  </div>
               )}
               {!isLoading && domainsData && domainsData.domains && domainsData.domains.length === 0 && (
                  <div className='noDomains mt-4 p-5 py-12 rounded border text-center bg-white text-sm'>
                     No Domains Found. Add a Domain to get started!
                  </div>
               )}
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} />
         </CSSTransition>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
            <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
      </div>
   );
};

export default SingleDomain;
