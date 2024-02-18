import React, { useContext, useState } from 'react';
import BuilderPlaceContext from '../modules/BuilderPlace/context/BuilderPlaceContext';
import { useRouter } from 'next/router';
import useFilteredServices from '../hooks/useFilteredServices';
import { IService, IToken, ServiceStatusEnum } from '../types';
import Loading from './Loading';
import ServiceItem from './ServiceItem';
import SearchServiceButton from './Form/SearchServiceButton';
import useAllowedTokens from '../hooks/useAllowedTokens';

function ServiceList() {
  const { builderPlace } = useContext(BuilderPlaceContext);
  const PAGE_SIZE = 30;
  const router = useRouter();
  const allowedTokens = useAllowedTokens();
  const query = router.query;
  const searchQuery = query.search as string;
  const [view, setView] = useState(1);
  const [isPopupVisible, setPopupVisible] = useState(false);

  const { hasMoreData, services, loading, loadMore } = useFilteredServices(
    ServiceStatusEnum.Opened,
    builderPlace?.owner?.talentLayerId?.toString(),
    undefined,
    searchQuery?.toLocaleLowerCase(),
    PAGE_SIZE,
  );

  return (
    <>
      {searchQuery && services.length > 0 && (
        <p className='text-xl font-medium tracking-wider mb-8'>
          Search results for <span className='text-base-content'>{searchQuery}</span>
        </p>
      )}
      {searchQuery && services.length === 0 && (
        <p className='text-xl font-medium tracking-wider mb-8'>
          No search results for <span className='text-base-content'>{searchQuery}</span>
        </p>
      )}

      <div className='flex flex-col md:flex-row mb-5'>
        <div className='flex mb-2 md:mb-0'>
          <button
            onClick={() => setView(1)}
            className={`px-4 py-2 rounded-full ${
              view === 1 ? 'bg-primary text-primary' : 'bg-transparent text-base-content'
            }`}>
            List View
          </button>
          <button
            onClick={() => setView(2)}
            className={`px-4 py-2 rounded-full ml-2 ${
              view === 2 ? 'bg-primary text-white' : 'bg-transparent text-base-content'
            }`}>
            Table View
          </button>

          <button className='px-4 py-2 rounded-full ml-auto md:hidden text-base-content border mr-2'>
            Filter
          </button>
        </div>

        <div className='relative ml-auto'>
          <button
            className='hidden md:block px-4 py-2 rounded-full ml-auto text-base-content border mr-2'
            onClick={() => setPopupVisible(!isPopupVisible)}>
            Filter
          </button>
          {isPopupVisible && (
            <div className='absolute bg-base-200 border border-3 border-gray-300 text-base-content p-4 shadow-lg rounded-lg mt-2 ml-2 z-50'>
              <div className='flex flex-col'>
                <label className='text-sm mt-1 font-bold'>Rate</label>
                <div className='flex flex-row gap-2'>
                  <input
                    type='number'
                    className='border border-3 border-gray-300 p-2 rounded w-24'
                    placeholder='Min'
                  />
                  <input
                    type='number'
                    className='border border-3 border-gray-300 p-2 rounded w-24'
                    placeholder='Max'
                  />
                </div>
                <label className='text-sm mt-3 font-bold'>Rating</label>
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <input type='checkbox' value='5' />
                    <label>5 stars</label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input type='checkbox' value='4' />
                    <label>4 stars</label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input type='checkbox' value='3' />
                    <label>3 stars</label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input type='checkbox' value='2' />
                    <label>2 stars</label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input type='checkbox' value='1' />
                    <label>1 star</label>
                  </div>
                </div>
                <label className='text-sm mt-3 font-bold'>Token</label>
                <div className='flex flex-col'>
                  {allowedTokens.map((token: IToken) => (
                    <div className='flex items-center gap-2' key={token.name}>
                      <input type='checkbox' value={token.name} />
                      <label>{token.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='mt-2 md:mt-0 md:mr-2'>
          <SearchServiceButton value={searchQuery} />
        </div>
      </div>

      {view === 1 &&
        services.map((service: IService, i: number) => (
          <ServiceItem
            service={service}
            embedded={router.asPath.includes('embed/')}
            key={i}
            view={view}
          />
        ))}

      {view === 2 && (
        <table className='min-w-full text-center'>
          <thead>
            <tr className='bg-primary text-primary'>
              <th className='border border-gray-300 p-2'>Title</th>
              <th className='border border-gray-300 p-2'>Date</th>
              <th className='border border-gray-300 p-2'>Rate</th>
              <th className='border border-gray-300 p-2'>Work</th>
              <th className='border border-gray-300 p-2'>View</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service: IService, i: number) => (
              <ServiceItem
                service={service}
                embedded={router.asPath.includes('embed/')}
                key={i}
                view={view}
              />
            ))}
          </tbody>
        </table>
      )}

      {services.length > 0 && hasMoreData && !loading && (
        <div className='flex justify-center items-center gap-10 flex-col pb-5'>
          <button
            type='submit'
            className={`px-5 py-2 mt-5 content-center border-2 text-base-content border-black rounded-xl font-medium text-content 
                `}
            disabled={!hasMoreData}
            onClick={() => loadMore()}>
            Load More Posts
          </button>
        </div>
      )}
      {loading && (
        <div className='flex justify-center items-center gap-10 flex-col pb-5 mt-5'>
          <Loading />
        </div>
      )}
    </>
  );
}

export default ServiceList;
