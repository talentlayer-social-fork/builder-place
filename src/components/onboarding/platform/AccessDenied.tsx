import { useWeb3Modal } from '@web3modal/wagmi/react';
import Link from 'next/link';
import { useAccount } from 'wagmi';

function AccessDenied() {
  const { address } = useAccount();
  const { open: openConnectModal } = useWeb3Modal();

  console.log('DEBUG', { address });

  return (
    <main className='grid min-h-full place-items-center bg-base-100 px-6 py-24 sm:py-32 lg:px-8'>
      <div className='text-center'>
        <p className='text-base-content font-semibold text-primary'>403</p>
        <h1 className='mt-4 text-3xl font-bold tracking-tight text-base-content sm:text-5xl'>
          Access denied
        </h1>
        <p className='mt-6 text-base-content leading-7 text-base-content'>
          <Link
            href='/newonboarding/create-profile'
            className='px-5 py-2 rounded-xl text-white bg-pink-500 hover:opacity-60'>
            Create an account first
          </Link>
        </p>
        <div className='mt-10 flex items-center justify-center gap-x-6'>
          {!address && (
            <p className='mt-4'>
              Already got a profile?{' '}
              <button
                onClick={() => {
                  openConnectModal();
                }}>
                <a className='text-block underline'>connect now</a>
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default AccessDenied;
