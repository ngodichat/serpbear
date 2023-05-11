import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import Icon from '../common/Icon';

type KeywordsHeaderProps = {
   showAddModal: Function,
   exportCsv?: Function,
   scFilter?: string
   setScFilter?: Function
}

const KeywordsHeader = ({ showAddModal, exportCsv, scFilter = 'thirtyDays', setScFilter }: KeywordsHeaderProps) => {
   const router = useRouter();
   const [showOptions, setShowOptions] = useState<boolean>(false);

   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';
   const buttonLabelStyle = 'ml-2 text-sm not-italic lg:invisible lg:opacity-0';
   const tabStyle = 'rounded rounded-b-none cursor-pointer border-[#e9ebff] border-b-0';

   const handleFileChange = (event: any) => {
      handleSubmit(event.target.files[0]);
   };

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
         <div className='flex w-full justify-between'>
            <ul className=' flex items-end text-sm relative top-[2px]'>
               <li className={`${tabStyle} ${router.pathname === '/keywords' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
                  <Link href={`/keywords`} passHref={true}>
                     <a className='px-4 py-2 inline-block'><Icon type="tracking" color='#999' classes='hidden lg:inline-block' />
                        <span className='text-xs lg:text-sm lg:ml-2'>Tracking</span>
                     </a>
                  </Link>
               </li>
            </ul>
            <div className={'flex mt-3 mb-0 lg:mb-3'}>
               <div
                  className={`hidden w-40 ml-[-70px] lg:block absolute mt-10 bg-white border border-gray-100 z-40 rounded 
            lg:z-auto lg:relative lg:mt-0 lg:border-0 lg:w-auto lg:bg-transparent`}
                  style={{ display: showOptions ? 'block' : undefined }}>
                  {
                     <button
                        className={`domheader_action_button relative ${buttonStyle}`}
                        aria-pressed="false"
                        onClick={() => exportCsv!()}>
                        <Icon type='download' size={20} /><i className={`${buttonLabelStyle}`}>Export as csv</i>
                     </button>
                  }
               </div>
               {
                  <button
                     data-testid="add_keyword"
                     className={'ml-2 inline-block px-4 py-2 text-blue-700 font-bold text-sm'}
                     onClick={() => showAddModal(true)}>
                     <span
                        className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                     <i className=' not-italic hidden lg:inline-block'>Add Keyword</i>
                  </button>
               }
            </div>
         </div>
      </div>
   );
};

export default KeywordsHeader;