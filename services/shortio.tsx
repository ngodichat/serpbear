import { NextRouter } from "next/router";
import toast from "react-hot-toast";
import { useQuery } from "react-query";

export const fetchLinkStats = async (router: NextRouter) => {
    if (!router.query.slug) { return []; }
    const res = await fetch(`${window.location.origin}/api/shortio/stat?domain=${router.query.slug}`, { method: 'GET' });
    return res.json();
 };

export function useFetchLinkStats(router: NextRouter) {
    const { data: linkStatsData, isLoading: linkStatsLoading, isError } = useQuery(
       ['linkstats', router.query.slug],
       () => fetchLinkStats(router),
       {
          onSuccess: (data) => {
          },
       },
    );
    return { linkStatsData: linkStatsData, linkStatsLoading: linkStatsLoading, isError };
 }