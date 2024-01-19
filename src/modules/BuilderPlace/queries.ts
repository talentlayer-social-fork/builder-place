import { IBuilderPlace } from './types';
import { getBuilderPlaceByDomain } from './actions/builderPlace';

// Used inside getServerSideProps
export const getBuilderPlace = async (domain: string): Promise<IBuilderPlace> => {
  console.log('serverProps', domain);
  const builderPlace = await getBuilderPlaceByDomain(domain);

  if (!builderPlace) {
    throw new Error(`BuilderPlace not found for domain ${domain}`);
  }

  const serializedBuilderPlace = JSON.parse(JSON.stringify(builderPlace));

  console.log({
    serializedBuilderPlace,
  });
  return serializedBuilderPlace;
};
