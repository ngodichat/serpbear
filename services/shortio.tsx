import { NextRouter } from "next/router";
import { useQuery } from "react-query";

export const fetchLinkStats = async (router: NextRouter, dateRange: string, filterParams: any) => {
   let tagFilters = '';
   if (filterParams.tags) {
      filterParams.tags.forEach((tag: any) => {
         tagFilters = tagFilters + `&tags=${tag}`
      });
   }
    let api = `${window.location.origin}/api/shortio/stats?dateRange=${dateRange}${tagFilters}`
    if (router.query.slug) { api = `${api}&domain=${router.query.slug}`};
    const res = await fetch(api, { method: 'GET' });
    return res.json();
 };

export function useFetchLinkStats(router: NextRouter, dateRange: string, filterParams: any = {}) {
    const { data: linkStatsData, isLoading: linkStatsLoading, isError } = useQuery(
       ['linkstats', router.query.slug, dateRange, filterParams],
       () => fetchLinkStats(router, dateRange, filterParams),
       {
          onSuccess: (data) => {
          },
       },
    );
    return { linkStatsData: linkStatsData, linkStatsLoading: linkStatsLoading, isError };
 }