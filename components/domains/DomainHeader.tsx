import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRefreshKeywords } from '../../services/keywords';
import Icon from '../common/Icon';
import SelectField from '../common/SelectField';
import { useFetchLinkStats } from '../../services/shortio';
import StatChart from '../common/StatChart';
import { generateStatChartData } from '../common/generateChartData';
import { useQueryClient } from 'react-query';

type DomainHeaderProps = {
   domain: DomainType,
   domains: DomainType[],
   showAddModal: Function,
   showAddDomainModal: Function,
   showSettingsModal: Function,
   exportCsv?: Function,
   scFilter?: string
   setScFilter?: Function
}

const DomainHeader = ({ domain, showAddModal, showSettingsModal, exportCsv, domains, scFilter = 'thirtyDays', setScFilter }: DomainHeaderProps) => {
   const router = useRouter();
   const queryClient = useQueryClient();
   const [showOptions, setShowOptions] = useState<boolean>(false);
   const [ShowSCDates, setShowSCDates] = useState<boolean>(false);
   const { mutate: refreshMutate } = useRefreshKeywords(() => { });
   const isConsole = router.pathname === '/domain/console/[slug]';
   const isInsight = router.pathname === '/domain/insight/[slug]';
   const isBacklink = router.pathname === '/domain/backlink/[slug]';
   const [chartTime, setChartTime] = useState<string>('30');
   const { linkStatsData } = useFetchLinkStats(router, chartTime);
   const dateOptions = [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days', value: '90' },
      { label: '1 Year', value: '360' },
      { label: 'All Time', value: 'all' },
   ];

   const daysName = (dayKey: string) => dayKey.replace('three', '3').replace('seven', '7').replace('thirty', '30').replace('Days', ' Days');
   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';
   const buttonLabelStyle = 'ml-2 text-sm not-italic lg:invisible lg:opacity-0';
   const tabStyle = 'rounded rounded-b-none cursor-pointer border-[#e9ebff] border-b-0';
   const scDataFilterStlye = 'px-3 py-2 block w-full';

   const linkStats = linkStatsData && linkStatsData.stats;
   const chartData = useMemo(() => {
      return generateStatChartData(linkStats, chartTime);
   }, [linkStats, chartTime]);

   const handleFileChange = (event: any) => {
      handleSubmit(event.target.files[0]);
   };

   useEffect(() => {
      queryClient.invalidateQueries(['linkstats']);
   }, [chartTime]);

   const handleSubmit = async (file: any) => {
      const formData = new FormData();
      formData.append('csv', file);

      try {
         const response = await axios.post('/api/backlinks', formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });
         toast('Import Backlinks Successfully!', { icon: '✔️' });
         console.log(response.data);
      } catch (error) {
         console.error(error);
         toast('Failed to import Backlinks!', { icon: '⚠️' });
      }
   };

   return (
      <div className='domain_kewywords_head w-full '>
         <div className='flex mb-2'>
            {/* <h1 className="hidden lg:block text-xl font-bold my-3" data-testid="domain-header">
               {domain && domain.domain && <><i className=' capitalize font-bold not-italic'>{domain.domain.charAt(0)}</i>{domain.domain.slice(1)}</>}
            </h1> */}
            <div className='domain_selector mt-2 flex-1 max-w-full'>
               <SelectField
                  options={domains && domains.length > 0 ? domains.map((d) => { return { label: d.domain, value: d.slug }; }) : []}
                  selected={[domain.slug]}
                  defaultLabel="Select Domain"
                  updateField={(updateSlug: [string]) => updateSlug && updateSlug[0] && router.push(`${updateSlug[0]}`)}
                  multiple={false}
                  rounded={'rounded'}
               />
            </div>
            {/* <div className='hidden lg:block sidebar_add font-semibold text-sm text-center text-zinc-500'>
               <button data-testid="add_domain" onClick={() => showAddDomainModal(true)} className='p-4 hover:text-blue-600'>+ Add Domain</button>
            </div> */}
            <div className='flex items-center'>
               <span className={`${domain.target_trust_flow && domain.target_trust_flow > 0 ? 'bg-[#DDFBE7]' : 'bg-[#E5E5E5]'} ml-4 p-1 px-2 text-xs rounded-full`}>TF: {domain.target_trust_flow ?? 0}</span>
               <span className={`${domain.target_citation_flow && domain.target_citation_flow > 0 ? 'bg-[#FCECD6]' : 'bg-[#E5E5E5]'} ml-4 p-1 px-2 text-xs rounded-full`}>CF: {domain.target_citation_flow ?? 0}</span>
            </div>
         </div>
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
                     updateField={(updatedTime:[string]) => setChartTime(updatedTime[0])}
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
         <div className='flex w-full justify-between'>
            <ul className=' flex items-end text-sm relative top-[2px]'>
               <li className={`${tabStyle} ${router.pathname === '/domain/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
                  <Link href={`/domain/${domain.slug}`} passHref={true}>
                     <a className='px-4 py-2 inline-block'><Icon type="tracking" color='#999' classes='hidden lg:inline-block' />
                        <span className='text-xs lg:text-sm lg:ml-2'>Tracking</span>
                     </a>
                  </Link>
               </li>
               <li className={`${tabStyle} ${router.pathname === '/domain/backlink/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
                  <Link href={`/domain/backlink/${domain.slug}`} passHref={true}>
                     <a className='px-4 py-2 inline-block'><Icon type="backlink" size={13} classes='hidden lg:inline-block' />
                        <span className='text-xs lg:text-sm lg:ml-2'>Backlinks</span>
                     </a>
                  </Link>
               </li>
               <li className={`${tabStyle} ${router.pathname === '/domain/console/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
                  <Link href={`/domain/console/${domain.slug}`} passHref={true}>
                     <a className='px-4 py-2 inline-block'><Icon type="google" size={13} classes='hidden lg:inline-block' />
                        <span className='text-xs lg:text-sm lg:ml-2'>Discover</span>
                        <Icon type='help' size={14} color="#aaa" classes="ml-2 hidden lg:inline-block" title='Discover Keywords you already Rank For' />
                     </a>
                  </Link>
               </li>
               <li className={`${tabStyle} ${router.pathname === '/domain/insight/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
                  <Link href={`/domain/insight/${domain.slug}`} passHref={true}>
                     <a className='px-4 py-2 inline-block'><Icon type="google" size={13} classes='hidden lg:inline-block' />
                        <span className='text-xs lg:text-sm lg:ml-2'>Insight</span>
                        <Icon type='help' size={14} color="#aaa" classes="ml-2 hidden lg:inline-block" title='Insight for Google Search Console Data' />
                     </a>
                  </Link>
               </li>
            </ul>
            <div className={'flex mt-3 mb-0 lg:mb-3'}>
               {!isInsight && <button className={`${buttonStyle} lg:hidden`} onClick={() => setShowOptions(!showOptions)}>
                  <Icon type='dots' size={20} />
               </button>
               }
               {isInsight && <button className={`${buttonStyle} lg:hidden invisible`}>x</button>}
               <div
                  className={`hidden w-40 ml-[-70px] lg:block absolute mt-10 bg-white border border-gray-100 z-40 rounded 
            lg:z-auto lg:relative lg:mt-0 lg:border-0 lg:w-auto lg:bg-transparent`}
                  style={{ display: showOptions ? 'block' : undefined }}>
                  {!isInsight && !isBacklink && (
                     <button
                        className={`domheader_action_button relative ${buttonStyle}`}
                        aria-pressed="false"
                        onClick={() => exportCsv!()}>
                        <Icon type='download' size={20} /><i className={`${buttonLabelStyle}`}>Export as csv</i>
                     </button>
                  )}
                  {!isConsole && !isInsight && !isBacklink && (
                     <button
                        className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
                        aria-pressed="false"
                        onClick={() => refreshMutate({ ids: [], domain: domain.domain })}>
                        <Icon type='reload' size={14} /><i className={`${buttonLabelStyle}`}>Reload All Serps</i>
                     </button>
                  )}
                  {!isBacklink && (
                     <button
                        data-testid="show_domain_settings"
                        className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
                        aria-pressed="false"
                        onClick={() => showSettingsModal(true)}><Icon type='settings' size={20} />
                        <i className={`${buttonLabelStyle}`}>Domain Settings</i>
                     </button>
                  )}
               </div>
               {!isConsole && !isInsight && !isBacklink && (
                  <button
                     data-testid="add_keyword"
                     className={'ml-2 inline-block px-4 py-2 text-blue-700 font-bold text-sm'}
                     onClick={() => showAddModal(true)}>
                     <span
                        className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                     <i className=' not-italic hidden lg:inline-block'>Add Keyword</i>
                  </button>
               )}
               {isConsole && (
                  <div className='text-xs pl-4 ml-2 border-l border-gray-200 relative'>
                     {/* <span className='hidden lg:inline-block'>Data From Last: </span> */}
                     <span className='block cursor-pointer py-3' onClick={() => setShowSCDates(!ShowSCDates)}>
                        <Icon type='date' size={13} classes="mr-1" /> {daysName(scFilter)}
                     </span>
                     {ShowSCDates && (
                        <div className='absolute w-24 z-50 mt-0 right-0 bg-white border border-gray-200 rounded text-center'>
                           {['threeDays', 'sevenDays', 'thirtyDays'].map((itemKey) => {
                              return <button
                                 key={itemKey}
                                 className={`${scDataFilterStlye} ${scFilter === itemKey ? ' bg-indigo-100 text-indigo-600' : ''}`}
                                 onClick={() => { setShowSCDates(false); if (setScFilter) setScFilter(itemKey); }}
                              >Last {daysName(itemKey)}
                              </button>;
                           })}
                        </div>
                     )}
                  </div>
               )}
               {isBacklink && (
                  <label htmlFor='import'
                     className={`domheader_action_button relative ${buttonStyle} cursor-pointer`}
                     aria-pressed="false">
                     <Icon type='upload' size={20} /><i className={`${buttonLabelStyle}`}>Import from csv</i>
                     <input id='import' className='hidden' type="file" onChange={handleFileChange} />
                  </label>
               )}
            </div>
         </div>
      </div>
   );
};

export default DomainHeader;
