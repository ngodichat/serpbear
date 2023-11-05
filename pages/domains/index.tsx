import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import { useQueryClient } from 'react-query';
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
import Paginator from '../../components/common/Paginator';

const SingleDomain: NextPage = () => {
   const router = useRouter();
   const queryClient = useQueryClient();
   const [noScrapprtError, setNoScrapprtError] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const { data: appSettings } = useFetchSettings();
   const [filterParams, setFilterParams] = useState<any>({ tags: [] });
   const { stats } = useFetchKeywordsStats(router);
   const [chartTime, setChartTime] = useState<string>('30');
   const { linkStatsData } = useFetchLinkStats(router, chartTime, filterParams);
   const dateOptions = [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days', value: '90' },
      { label: '1 Year', value: '360' },
      { label: 'All Time', value: 'all' },
   ];
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState<number>(1);
   const { data: domainsData, isLoading } = useFetchDomains(router, chartTime, true, currentPage, filterParams);
   const [allDomainTags, setAllDomainTags] = useState<string[]>([]);

   const onPageChange = (pageNum: number) => {
      router.push({ pathname: '/domains', query: { page: pageNum} });
      setCurrentPage(pageNum);
   };

   useEffect(() => {
      // Ensure that router is ready and page query exists
    if (router.isReady) {
      // router.query.page might be undefined, string or string[], so we ensure it's a string
      const pageQuery = router.query.page;
      const page = typeof pageQuery === 'string' ? parseInt(pageQuery, 10) : 1;

      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
    }, [router.query.page]);

   useEffect(() => {
      console.log('Domains Data: ', domainsData);
      queryClient.invalidateQueries(['domains', 'linkstats']);
   }, [chartTime]);

   useEffect(() => {
      setTotalPages(domainsData ? domainsData.totalPages : 1);
      setAllDomainTags(domainsData ? domainsData.tags : []);
      if (sessionStorage.getItem('filterParams')) {
         const filters = sessionStorage.getItem('filterParams');
         setFilterParams(JSON.parse(filters!));
      }
   }, [domainsData]);

   useEffect(() => {
      console.log('Keywords Data: ', stats);
   }, [stats]);

   useEffect(() => {
      // console.log('appSettings.settings: ', appSettings && appSettings.settings);
      if (appSettings && appSettings.settings && (!appSettings.settings.scraper_type || (appSettings.settings.scraper_type === 'none'))) {
         setNoScrapprtError(true);
      }
   }, [appSettings]);

   const filterTags = (updated: any) => {
      setFilterParams({ ...filterParams, tags: updated });
      sessionStorage.setItem('filterParams', JSON.stringify({ ...filterParams, tags: updated }));
   };

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

         <div className="flex flex-col w-full max-w-7xl mx-auto p-6 lg:mt-8 lg:p-6">
            <div className='flex justify-between mb-2 items-center'>
               <div className='hidden lg:flex'>
                  <div className=' text-sm border-r-2 pr-2'>{domainsData?.totalDomains || 0} Domains</div>
                  <div className=' text-sm border-r-2 px-2'>{domainsData?.totalKeywords || 0} Keywords</div>
                  <div className=' text-sm border-r-2 px-2'>{stats?.desktop || 0} Desktop</div>
                  <div className=' text-sm px-2'>{stats?.mobile || 0} Mobile</div>
               </div>
               <div className={'tags_filter mb-2 lg:mb-0 w-full lg:w-[250px]'}>
                  <SelectField
                     selected={filterParams.tags}
                     options={allDomainTags.map((tag: string) => ({ label: tag, value: tag }))}
                     defaultLabel='All Tags'
                     updateField={(updated: string[]) => filterTags(updated)}
                     emptyMsg="No Tags Found"
                  />
               </div>
            </div>
            <div className='stat-chart lg:block domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-8'>
               <span className='domKeywords_filters py-4 px-6 flex justify-between items-center text-sm text-gray-500 font-semibold border-b-[1px] lg:flex-row'>
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

         <div className='mb-8'>
            <Paginator
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={onPageChange}
            />
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
