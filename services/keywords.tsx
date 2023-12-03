import toast from 'react-hot-toast';
import { NextRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from 'react-query';

export const fetchKeywords = async (router: NextRouter) => {
   if (!router.query.slug) { return []; }
   const res = await fetch(`${window.location.origin}/api/keywords?domain=${router.query.slug}`, { method: 'GET' });
   return res.json();
};

export const fetchCustomKeywords = async (router: NextRouter) => {
   let page = router.query.page;
   const searchParam = router.query.search;
   if (!router.query.page) { page = '1' };
   let query = `${window.location.origin}/api/custom_keywords?`;
   let queryParams: any = { page, device: router.query.device };
   if (searchParam && searchParam !== '') {
      queryParams = { ...queryParams, search: searchParam };
   }
   if (router.query.sort) {
      queryParams = { ...queryParams, sort: router.query.sort };
   }
   if (router.query.domain && router.query.domain !== '') {
      queryParams = { ...queryParams, domain: router.query.domain };
   }
   if (router.query.country) {
      queryParams = { ...queryParams, country: router.query.country };
   }
   if (router.query.tags) {
      queryParams = { ...queryParams, tags: router.query.tags };
   }
   query = query + new URLSearchParams(queryParams).toString();
   const res = await fetch(`${query}`, { method: 'GET' });
   return res.json();
};

export const fetchKeywordsStats = async (router: NextRouter) => {
   const res = await fetch(`${window.location.origin}/api/keywords?withstats=true`, { method: 'GET' });
   return res.json();
};

export function useFetchKeywordsStats(router: NextRouter) {
   const { data: stats } = useQuery([], () => fetchKeywordsStats(router), {});
   return { stats };
}

export function useFetchKeywords(router: NextRouter, setKeywordSPollInterval?: Function, keywordSPollInterval: undefined | number = undefined) {
   const { data: keywordsData, isLoading: keywordsLoading, isError } = useQuery(
      ['keywords', router.query.slug],
      () => fetchKeywords(router),
      {
         refetchInterval: keywordSPollInterval,
         onSuccess: (data) => {
            // If Keywords are Manually Refreshed check if the any of the keywords position are still being fetched
            // If yes, then refecth the keywords every 5 seconds until all the keywords position is updated by the server
            if (data.keywords && data.keywords.length > 0 && setKeywordSPollInterval) {
               const hasRefreshingKeyword = data.keywords.some((x: KeywordType) => x.updating);
               if (hasRefreshingKeyword) {
                  setKeywordSPollInterval(5000);
               } else {
                  if (keywordSPollInterval) {
                     toast('Keywords Refreshed!', { icon: '✔️' });
                  }
                  setKeywordSPollInterval(undefined);
               }
            }
         },
      },
   );
   return { keywordsData, keywordsLoading, isError };
}

export function useFetchCustomKeywords(router: NextRouter, setKeywordSPollInterval?: Function, keywordSPollInterval: undefined | number = undefined) {
   const { data: keywordsData, isLoading: keywordsLoading, isError } = useQuery(
      ['custom_keywords', router.query],
      () => fetchCustomKeywords(router),
      {
         refetchInterval: keywordSPollInterval,
         onSuccess: (data) => {
            // If Keywords are Manually Refreshed check if the any of the keywords position are still being fetched
            // If yes, then refecth the keywords every 5 seconds until all the keywords position is updated by the server
            if (data.keywords && data.keywords.length > 0 && setKeywordSPollInterval) {
               data.keywords.forEach((kw: any) => kw.tags = JSON.parse(kw.tags));
               const hasRefreshingKeyword = data.keywords.some((x: KeywordType) => x.updating);
               if (hasRefreshingKeyword) {
                  setKeywordSPollInterval(5000);
               } else {
                  if (keywordSPollInterval) {
                     toast('Keywords Refreshed!', { icon: '✔️' });
                  }
                  setKeywordSPollInterval(undefined);
               }
            }
         },
      },
   );
   return { keywordsData, keywordsLoading, isError };
}

export function useAddKeywords(onSuccess: Function) {
   const queryClient = useQueryClient();
   return useMutation(async ({ keywords, useExistingData = false}: { keywords: KeywordAddPayload[], useExistingData?: boolean }) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ keywords, useExistingData }) };
      const res = await fetch(`${window.location.origin}/api/keywords`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         console.log('Keywords Added!!!');
         toast('Keywords Added Successfully!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries(['keywords']);
      },
      onError: () => {
         console.log('Error Adding New Keywords!!!');
         toast('Error Adding New Keywords', { icon: '⚠️' });
      },
   });
}

export function useDeleteKeywords(onSuccess: Function) {
   const queryClient = useQueryClient();
   return useMutation(async (keywordIDs: number[]) => {
      const keywordIds = keywordIDs.join(',');
      const res = await fetch(`${window.location.origin}/api/keywords?id=${keywordIds}`, { method: 'DELETE' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         console.log('Removed Keyword!!!');
         onSuccess();
         toast('Keywords Removed Successfully!', { icon: '✔️' });
         queryClient.invalidateQueries(['keywords']);
      },
      onError: () => {
         console.log('Error Removing Keyword!!!');
         toast('Error Removing the Keywords', { icon: '⚠️' });
      },
   });
}

export function useFavKeywords(onSuccess: Function) {
   const queryClient = useQueryClient();
   return useMutation(async ({ keywordID, sticky }: { keywordID: string, sticky: boolean }) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify({ sticky }) };
      const res = await fetch(`${window.location.origin}/api/keywords?id=${keywordID}`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async (data) => {
         onSuccess();
         const isSticky = data.keywords[0] && data.keywords[0].sticky;
         toast(isSticky ? 'Keywords Made Favorite!' : 'Keywords Unfavorited!', { icon: '✔️' });
         queryClient.invalidateQueries(['keywords']);
      },
      onError: () => {
         console.log('Error Changing Favorite Status!!!');
         toast('Error Changing Favorite Status.', { icon: '⚠️' });
      },
   });
}

export function useUpdateKeywordTags(onSuccess: Function) {
   const queryClient = useQueryClient();
   return useMutation(async ({ tags }: { tags: { [ID: number]: string[] } }) => {
      const keywordIds = Object.keys(tags).join(',');
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify({ tags }) };
      const res = await fetch(`${window.location.origin}/api/keywords?id=${keywordIds}`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         onSuccess();
         toast('Keyword Tags Updated!', { icon: '✔️' });
         queryClient.invalidateQueries(['keywords']);
      },
      onError: () => {
         console.log('Error Updating Keyword Tags!!!');
         toast('Error Updating Keyword Tags.', { icon: '⚠️' });
      },
   });
}

export function useRefreshKeywords(onSuccess: Function) {
   const queryClient = useQueryClient();
   return useMutation(async ({ ids = [], domain = '' }: { ids?: number[], domain?: string }) => {
      const keywordIds = ids.join(',');
      console.log(keywordIds);
      const query = ids.length === 0 && domain ? `?id=all&domain=${domain}` : `?id=${keywordIds}`;
      const res = await fetch(`${window.location.origin}/api/refresh${query}`, { method: 'POST' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         console.log('Keywords Added to Refresh Queue!!!');
         onSuccess();
         toast('Keywords Added to Refresh Queue', { icon: '🔄' });
         queryClient.invalidateQueries(['keywords']);
      },
      onError: () => {
         console.log('Error Refreshing Keywords!!!');
         toast('Error Refreshing Keywords.', { icon: '⚠️' });
      },
   });
}

export const downloadCSV = async (filters: any) => {
   try {
      // Fetch the CSV data from the API
      const response = await fetch(`${window.location.origin}/api/custom_keywords?export=csv`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(filters),
      });

      // Check if the request was successful
      if (!response.ok) {
         toast('Error Downloading csv file.', { icon: '⚠️' });
         return;
      }

      // Convert the streamed response object to a Blob
      const blob = await response.blob();

      // Create an object URL for the Blob object
      const url = URL.createObjectURL(blob);

      // Generate current date string in 'YYYY-MM-DD' format
      const currentDate = new Date().toISOString().slice(0, 10)

      // Create a link element, hide it, direct it towards the object URL and trigger it
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `export_${currentDate}.csv`;  // the file name

      // Add the link to the DOM and simulate a click to start the download
      document.body.appendChild(a);
      a.click();

      // Dispose of the object URL and remove the link from the DOM
      URL.revokeObjectURL(url);
      a.remove();
   } catch (error) {
      console.error('There was a problem with the download:', error);
   }
};

export const fetchKeywordsCountByCountry = async () => {
   const res = await fetch(`${window.location.origin}/api/keywords/stats?groupByCountry=true`, { method: 'GET' });
   return res.json();
};

export function useFetchKeywordsCountByCountry() {
   const { data: keywordsCountByCountry, isLoading: isLoading, isError } = useQuery(
      ['keywordsCountByCountry'],
      () => fetchKeywordsCountByCountry(),
      {
         onSuccess: (data) => {

         },
      },
   );
   return { keywordsCountByCountry, isLoading, isError };
}
