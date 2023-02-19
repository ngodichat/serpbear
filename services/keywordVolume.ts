import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

const useUpdateKeywordVolume = (onSuccess:Function|undefined) => {
   const queryClient = useQueryClient();

   return useMutation(async (settings: SettingsType) => {
      // console.log('settings: ', JSON.stringify(settings));

      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ settings }) };
      const res = await fetch(`${window.location.origin}/api/volume`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         if (onSuccess) {
            onSuccess();
         }
         toast('Updated!', { icon: '✔️' });
        //  queryClient.invalidateQueries(['settings']);
      },
      onError: () => {
         console.log('Error Updating App Settings!!!');
         toast('Error Updating App Settings.', { icon: '⚠️' });
      },
   });
};

export default useUpdateKeywordVolume;
