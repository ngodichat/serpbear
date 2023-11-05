import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import Settings from '../../components/settings/Settings';
import { useFetchSettings } from '../../services/settings';
import { downloadCSV, useFetchCustomKeywords } from '../../services/keywords';
import KeywordsHeader from '../../components/keywords/KeywordsHeader';
import Paginator from '../../components/common/Paginator';
import AllKeywordsTable from '../../components/keywords/AllKeywordsTable';

const KeywordsPage: NextPage = () => {
   const router = useRouter();
   const [noScrapprtError, setNoScrapprtError] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddKeywords, setShowAddKeywords] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [keywordSPollInterval, setKeywordSPollInterval] = useState<undefined | number>(undefined);
   const { data: appSettings } = useFetchSettings();

   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [filters, setFilters] = useState<any>('');
   const [countByDevice, setCountByDevice] = useState<any>();

   const exportCSV = () => {
      downloadCSV({ ...filters.filterParams, sort: filters.sortBy });
   };

   const onPageChange = (pageNum: number) => {
      setCurrentPage(pageNum);
      // router.push({ pathname: '/keywords', query: { page: pageNum, search: filters.filterParams.search } });
      filterKeywords({ ...filters, page: pageNum });
   };
   
   const { keywordsData, keywordsLoading } = useFetchCustomKeywords(router, setKeywordSPollInterval, keywordSPollInterval);

   const theKeywords: KeywordType[] = keywordsData && keywordsData.keywords;

   useEffect(() => {
      // console.log('appSettings.settings: ', appSettings && appSettings.settings);
      if (appSettings && appSettings.settings && (!appSettings.settings.scraper_type || (appSettings.settings.scraper_type === 'none'))) {
         setNoScrapprtError(true);
      }
   }, [appSettings]);

   useEffect(() => {
      const pages = keywordsData ? Math.ceil(keywordsData.count / 100) : 1;
      setTotalPages(pages);
      if (keywordsData) { setCountByDevice(keywordsData.byDevice); }
   }, [keywordsData]);

   const filterKeywords = (mFilters: any) => {
      setFilters(mFilters);
      let q: any = { page: mFilters.page ?? 1, country: mFilters.filterParams.countries, device: mFilters.filterParams.device ?? 'desktop', sort: mFilters.sortBy };
      setCurrentPage(mFilters.page ?? 1);
      if (mFilters.filterParams.search !== '') {
         q = { ...q, search: mFilters.filterParams.search };
      }
      if (mFilters.filterParams.domain !== '') {
         q = { ...q, domain: mFilters.filterParams.domain };
      }
      router.push({ pathname: '/keywords', query: q });
   };

   return (
      <div className="Domain ">
         {noScrapprtError && (
            <div className=' p-3 bg-red-600 text-white text-sm text-center'>
               A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
            </div>
         )}
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} showAddDomainModal={() => setShowAddDomain(true)} />
         <div className="flex w-full max-w-7xl mx-auto">
            <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full mb-8">
               <KeywordsHeader showAddModal={setShowAddKeywords} exportCsv={() => exportCSV()}
               />
               <AllKeywordsTable
                  isLoading={keywordsLoading}
                  showPosition={true && filters.filterParams && (filters.filterParams.domain !== '')}
                  compareWithHistory={false}
                  showHistory={false}
                  domain={null}
                  keywords={theKeywords}
                  countByDevice={countByDevice}
                  filter={filterKeywords}
                  backlinks={[]}
                  showAddModal={showAddKeywords}
                  setShowAddModal={setShowAddKeywords}
                  isConsoleIntegrated={!!(appSettings && appSettings?.settings?.search_console_integrated)}
               />
               <Paginator
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
               />
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

export default KeywordsPage;
