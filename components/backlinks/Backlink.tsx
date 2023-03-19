import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import Icon from '../common/Icon';

dayjs.extend(customParseFormat);

type BacklinkProps = {
    backLinkData: BacklinkType,
}

const Backlink = (props: BacklinkProps) => {
    const {
       backLinkData,
    } = props;
    const {
       URL, anchor_text, source_trust_flow, source_citation_flow, domain_trust_flow, domain_citation_flow, link_first_index_date, last_updated,
    } = backLinkData;

    return (
        <div className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
        flex lg:justify-between lg:items-center`}>
            <div className='flex-1 break-all'>{URL}</div>
            <div className='hidden flex-1 lg:block basis-32 grow-0'>{dayjs(link_first_index_date, 'DD/MM/YYYY HH:mm').format('DD-MMM-YYYY')}</div>
            <div className='flex-1 basis-16 grow-0'>{source_trust_flow}</div>
            <div className='hidden flex-1 lg:block basis-16 grow-0'>{source_citation_flow}</div>
            <div className='hidden flex-1 lg:block basis-16 grow-0'>{domain_trust_flow}</div>
            <div className='hidden flex-1 lg:block basis-16 grow-0'>{domain_citation_flow}</div>
            <div className='hidden lg:block basis-44 grow-0'>{anchor_text}</div>
            <div className='hidden flex-1 lg:block basis-32 grow-0'>
                <span className='mr-2 lg:hidden'><Icon type="clock" size={14} color="#999" /></span>
                <TimeAgo title={dayjs(last_updated).format('DD-MMM-YYYY, hh:mm:ss A')} date={last_updated} />
            </div>
        </div>
    );
};

export default Backlink;
