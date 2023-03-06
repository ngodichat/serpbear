import { NextRouter } from "next/router";
import toast from "react-hot-toast";
import { useQuery } from "react-query";

export const fetchBacklinks = async (router: NextRouter) => {
    if (!router.query.slug) { return []; }
    const res = await fetch(`${window.location.origin}/api/backlinks?domain=${router.query.slug}`, { method: 'GET' });
    return res.json();
 };

export function useFetchBacklinks(router: NextRouter, setKeywordSPollInterval?:Function, keywordSPollInterval:undefined|number = undefined) {
    const { data: backlinksData, isLoading: backlinksLoading, isError } = useQuery(
       ['backlinks', router.query.slug],
       () => fetchBacklinks(router),
       {
          refetchInterval: keywordSPollInterval,
          onSuccess: (data) => {
             // If Keywords are Manually Refreshed check if the any of the keywords position are still being fetched
             // If yes, then refecth the keywords every 5 seconds until all the keywords position is updated by the server
             if (data.keywords && data.keywords.length > 0 && setKeywordSPollInterval) {
                const hasRefreshingKeyword = data.keywords.some((x:KeywordType) => x.updating);
                if (hasRefreshingKeyword) {
                   setKeywordSPollInterval(5000);
                } else {
                   if (keywordSPollInterval) {
                      toast('Backlinks Refreshed!', { icon: '✔️' });
                   }
                   setKeywordSPollInterval(undefined);
                }
             }
          },
       },
    );
    return { backlinksData: backlinksData, backlinksLoading: backlinksLoading, isError };
 }