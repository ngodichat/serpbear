import { NextRouter } from "next/router";
import { useQuery } from "react-query";

export const fetchLinkStats = async (router: NextRouter, dateRange: string) => {
    let api = `${window.location.origin}/api/shortio/stats?dateRange=${dateRange}`
    if (router.query.slug) { api = `${api}&domain=${router.query.slug}`};
    const res = await fetch(api, { method: 'GET' });
    return res.json();
 };

export function useFetchLinkStats(router: NextRouter, dateRange: string) {
    const { data: linkStatsData, isLoading: linkStatsLoading, isError } = useQuery(
       ['linkstats', router.query.slug, dateRange],
       () => fetchLinkStats(router, dateRange),
       {
          onSuccess: (data) => {
          },
       },
    );
    return { linkStatsData: linkStatsData, linkStatsLoading: linkStatsLoading, isError };
 }