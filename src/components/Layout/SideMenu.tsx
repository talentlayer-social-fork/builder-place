import { useContext } from 'react';
import TalentLayerContext from '../../context/talentLayer';
import BuilderPlaceContext from '../../modules/BuilderPlace/context/BuilderPlaceContext';
import SideLink from './SideLink';
import {
  hirerAdminNavigation,
  hirerNavigation,
  ownerAdminNavigation,
  PlatformAdminNavigation,
  workerNavigation,
} from './navigation';
import Image from 'next/image';
import Link from 'next/link';
import useEnrichMenu from '../../hooks/useEnrichMenu';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { GetServerSidePropsContext } from 'next';
import { sharedGetServerSideProps } from '../../utils/sharedGetServerSideProps';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return sharedGetServerSideProps(context);
}
function SideMenu() {
  const { user } = useContext(TalentLayerContext);
  const { isBuilderPlaceCollaborator, isBuilderPlaceOwner, builderPlace } =
    useContext(BuilderPlaceContext);
  // const { enrichedWorkerNavigation } = useEnrichMenu(
  //   builderPlace?.jobPostingConditions?.allowPosts,
  //   !isBuilderPlaceCollaborator,
  // );
  const enrichedWorkerNavigation = builderPlace?.jobPostingConditions?.allowPosts
    ? [
        ...workerNavigation,
        {
          name: 'new mission',
          href: '/work/create',
          icon: PlusCircleIcon,
          current: false,
        },
      ]
    : workerNavigation;

  return (
    <>
      <div className='sm:mt-8 flex flex-1 flex-col justify-between'>
        <nav className='space-y-1 px-3'>
          {isBuilderPlaceCollaborator && (
            <>
              <div className='pt-4'>
                <div className='border-info h-px mx-3'></div>
                <h2 className='text-base-content font-bold ml-3'>PROJECT MANAGEMENT</h2>
                <nav className='space-y-1 mt-6'>
                  {hirerNavigation
                    .filter(item => item.name !== 'my place')
                    .map(item => (
                      <SideLink key={item.name} href={item.href}>
                        <item.icon
                          className='mr-3 h-5 w-5 flex-shrink-0 text-base-content'
                          aria-hidden='true'
                        />
                        {item.name}
                      </SideLink>
                    ))}
                </nav>
              </div>

              <div className='pt-4'>
                <h2 className='text-base-content font-bold ml-3 mt-6'>ADMIN</h2>
                <nav className='space-y-1 mt-6'>
                  {hirerAdminNavigation.map(item => (
                    <SideLink key={item.name} href={item.href}>
                      <item.icon
                        className='mr-3 h-5 w-5 flex-shrink-0 text-base-content'
                        aria-hidden='true'
                      />
                      {item.name}
                    </SideLink>
                  ))}
                  {isBuilderPlaceOwner &&
                    ownerAdminNavigation.map(item => (
                      <SideLink key={item.name} href={item.href}>
                        <item.icon
                          className='mr-3 h-5 w-5 flex-shrink-0 text-base-content'
                          aria-hidden='true'
                        />
                        {item.name}
                      </SideLink>
                    ))}
                </nav>
              </div>
            </>
          )}

          {!isBuilderPlaceCollaborator && (
            <nav className='space-y-1 mt-6'>
              {enrichedWorkerNavigation.map(item => (
                <SideLink key={item.name} href={item.href}>
                  <item.icon
                    className='mr-3 h-5 w-5 flex-shrink-0 text-base-content'
                    aria-hidden='true'
                  />
                  {item.name}
                </SideLink>
              ))}
            </nav>
          )}

          {user?.isAdmin && (
            <div className='pt-4'>
              <h2 className='text-base-content font-bold ml-3 mt-6'>PLATFORM</h2>
              <nav className='space-y-1 mt-6'>
                {PlatformAdminNavigation.map(item => (
                  <SideLink key={item.name} href={item.href}>
                    <item.icon
                      className='mr-3 h-5 w-5 flex-shrink-0 text-base-content'
                      aria-hidden='true'
                    />
                    {item.name}
                  </SideLink>
                ))}
              </nav>
            </div>
          )}
        </nav>
      </div>
      <div className='mt-8 flex flex-1 flex-col items-center justify-end pb-4'>
        {isBuilderPlaceCollaborator && (
          <div className='block mb-4'>
            <Link
              href='/'
              className='text-primary bg-primary hover:opacity-70 px-4 py-2.5 rounded-xl text-sm relative'>
              view my place
            </Link>
          </div>
        )}
        <div className='block py-4 text-center'>
          <a
            href='https://builder.place'
            className='block max-w-[128px] opacity-30 hover:opacity-100 relative '>
            <Image
              src='/logo-text-dark.png'
              alt='logo'
              width={128}
              height={20}
              className='drop-shadow-xl'
              style={{
                WebkitFilter: 'drop-shadow(0px 0px 10px #FFFFFF)',
                filter: 'drop-shadow(0px 0px 10px #FFFFFF)',
              }}
            />
          </a>
          <a href='https://tally.so/r/w8Zp5z' target='_blank' className='underline text-xs p-1'>
            report a bug
          </a>
        </div>
      </div>
    </>
  );
}

export default SideMenu;
