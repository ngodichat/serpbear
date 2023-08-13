import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAddDomain } from '../../services/domains';
import Icon from '../common/Icon';

type AddDomainProps = {
   closeModal: Function
}

type DomainInput = {
   domain: string,
   tags: string,
}

const AddDomain = ({ closeModal }: AddDomainProps) => {
   const [newDomain, setNewDomain] = useState<DomainInput>({ domain: '', tags: '' });
   const [newDomainError, setNewDomainError] = useState<boolean>(false);
   const { mutate: addMutate, isLoading: isAdding } = useAddDomain(() => closeModal());

   const addDomain = () => {
      console.log('ADD NEW DOMAIN', newDomain);
      // if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(newDomain.trim())) {
      if (/^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=,]*)$/.test(newDomain.domain.trim())) {
         setNewDomainError(false);
         // TODO: Domain Action
         addMutate(newDomain);
      } else {
         setNewDomainError(true);
      }
   };

   const handleDomainInput = (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.value === '' && newDomainError) { setNewDomainError(false); }
      const domain = {
         domain: e.currentTarget.value,
         tags: newDomain.tags,
      };
      setNewDomain(domain);
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={'Add New Domain'}>
         <div data-testid="adddomain_modal">
            <h4 className='text-sm mt-4'>
               URL {newDomainError && <span className=' ml-2 block float-right text-red-500 text-xs font-semibold'>Not a Valid URL</span>}
            </h4>
            <input
               className={`w-full p-2 border border-gray-200 rounded mt-2 mb-3 focus:outline-none  focus:border-blue-200 
               ${newDomainError ? ' border-red-400 focus:border-red-400' : ''} `}
               type="text"
               value={newDomain.domain}
               placeholder={'example.com'}
               onChange={handleDomainInput}
               autoFocus={true}
               onKeyDown={(e) => {
                  if (e.code === 'Enter') {
                     e.preventDefault();
                     addDomain();
                  }
               }}
            />
            <div className='relative'>
               {/* TODO:  Insert Existing Tags as Suggestions */}
               <input
                  className='w-full border rounded border-gray-200 py-2 px-4 pl-8 outline-none focus:border-indigo-300'
                  placeholder='Insert Tags'
                  value={newDomain.tags}
                  onChange={(e) => setNewDomain({ ...newDomain, tags: e.target.value })}
               />
               <span className='absolute text-gray-400 top-2 left-2'><Icon type="tags" size={16} /></span>
            </div>
            <div className='mt-6 text-right text-sm font-semibold'>
               <button className='py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3' onClick={() => closeModal(false)}>Cancel</button>
               <button className='py-2 px-5 rounded cursor-pointer bg-blue-700 text-white' onClick={() => !isAdding && addDomain()}>
                  {isAdding ? 'Adding....' : 'Add Domain'}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default AddDomain;
