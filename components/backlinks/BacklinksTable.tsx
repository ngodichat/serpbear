import React from 'react';
import { Toaster } from 'react-hot-toast';
import Backlink from './Backlink';

type BacklinksTableProps = {
   backlinks: BacklinkType[],
   isLoading: boolean,
}

const BacklinksTable = (props: BacklinksTableProps) => {
   const { backlinks = [], isLoading = true } = props;

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-8'>
            <div className={`domkeywordsTable domkeywordsTable--keywords} 
               styled-scrollbar w-full overflow-auto min-h-[60vh]`}>
               <div className=' lg:min-w-[800px]'>
                  <div className={`domBacklinks_filters hidden lg:flex p-3 px-6 bg-[#FCFCFF]
                   text-gray-600 justify-between items-center font-semibold border-y`}>
                    <span className='domBacklinks_filters_item_count flex-1 basis-[44rem] grow-0 w-auto '>{backlinks.length} results</span>
                    <span className='flex-1 basis-28 grow-0'>URL</span>
                    <span className='flex-1 '>Domain</span>
                  </div>
                  <div className={`domKeywords_head hidden lg:flex p-3 px-6 bg-[#FCFCFF]
                   text-gray-600 justify-between items-center font-semibold border-y`}>
                     <span className='domKeywords_head_keyword flex-1 w-auto '>
                        URL
                     </span>
                     <span className='flex-1 basis-32 grow-0'>First Indexed</span>
                     <span className='flex-1 basis-16 grow-0'>TF</span>
                     <span className='flex-1 basis-16 grow-0'>CF</span>
                     <span className='flex-1 basis-16 grow-0'>TF</span>
                     <span className='flex-1 basis-16 grow-0'>CF</span>
                     <span className='flex-1 basis-44 grow-0'>Anchor Text</span>
                     <span className='flex-1 basis-32 grow-0'>Updated</span>
                  </div>
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                     {backlinks.length > 0
                        && backlinks.map((backlink) => <Backlink
                                                            key={backlink.URL}
                                                            backLinkData={backlink}
                                                      />)}
                     {!isLoading && backlinks.length === 0 && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>No Backlink Added for this domain.</p>
                     )}
                     {isLoading && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>Loading Backlinks...</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
 };

 export default BacklinksTable;
