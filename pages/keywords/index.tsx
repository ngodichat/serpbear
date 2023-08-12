import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import Settings from '../../components/settings/Settings';
import { useFetchSettings } from '../../services/settings';
import KeywordsTable from '../../components/keywords/KeywordsTable';
import { useFetchCustomKeywords } from '../../services/keywords';
import KeywordsHeader from '../../components/keywords/KeywordsHeader';
import Paginator from '../../components/common/Paginator';

const KeywordsPage: NextPage = () => {
   const router = useRouter();
   const [noScrapprtError, setNoScrapprtError] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddKeywords, setShowAddKeywords] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [keywordSPollInterval, setKeywordSPollInterval] = useState<undefined|number>(undefined);
   const { data: appSettings } = useFetchSettings();

   const [currentPage, setCurrentPage] = useState(1);
   const totalPages = 10;

   const onPageChange = (pageNum: number) => {
      setCurrentPage(pageNum);
   };
   const { keywordsData, keywordsLoading } = useFetchCustomKeywords(router, setKeywordSPollInterval, keywordSPollInterval);

   const theKeywords: KeywordType[] = keywordsData && keywordsData.keywords;

   useEffect(() => {
      // console.log('appSettings.settings: ', appSettings && appSettings.settings);
      if (appSettings && appSettings.settings && (!appSettings.settings.scraper_type || (appSettings.settings.scraper_type === 'none'))) {
         setNoScrapprtError(true);
      }
   }, [appSettings]);

   return (
    <div className="Domain ">
       {noScrapprtError && (
             <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
             </div>
       )}
       <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} showAddDomainModal={() => setShowAddDomain(true)} />
       <div className="flex w-full max-w-7xl mx-auto">
          <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
            <KeywordsHeader showAddModal={setShowAddKeywords}
            />
             <KeywordsTable
             isLoading={keywordsLoading}
             showPosition={false}
             showHistory={false}
             domain={null}
             keywords={theKeywords}
             backlinks={[]}
             showAddModal={showAddKeywords}
             setShowAddModal={setShowAddKeywords}
             isConsoleIntegrated={!!(appSettings && appSettings?.settings?.search_console_integrated) }
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
