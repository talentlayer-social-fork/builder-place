import { getBuilderPlace } from '../../../modules/BuilderPlace/queries';
import ProfileForm from '../../../components/Form/ProfileForm';
import BuilderPlaceContext from '../../../modules/BuilderPlace/context/BuilderPlaceContext';
import { useContext } from 'react';
import AccessDenied from '../../../components/AccessDenied';

export async function getServerSideProps({ params }: any) {
  return await getBuilderPlace(params.domain);
}

export default function HirerProfile() {
  const { builderPlaceOwner, isBuilderPlaceOwner } = useContext(BuilderPlaceContext);

  if (!isBuilderPlaceOwner) {
    return <AccessDenied />;
  }

  return (
    <>
      <h1>Hirer profile</h1>
      <ProfileForm isUserDelegatedOwner={true} editedUser={builderPlaceOwner} />
    </>
  );
}
