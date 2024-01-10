import { $Enums, EntityStatus, PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();
import {
  addDomainToVercel,
  getApexDomain,
  removeDomainFromVercelProject,
  removeDomainFromVercelTeam,
  validDomainRegex,
} from './domains';
import {
  CreateBuilderPlaceAction,
  CreateWorkerProfileAction,
  UpdateBuilderPlace,
  UpdateBuilderPlaceDomain,
  AddBuilderPlaceCollaborator,
  RemoveBuilderPlaceCollaborator,
  SetBuilderPlaceOwner,
  CreateHirerProfileAction,
  SetBuilderPlaceAndHirerOwner,
  SetUserProfileOwner,
  SetHirerProfileOwner,
} from './types';
import { NextApiResponse } from 'next';
import { MAX_TRANSACTION_AMOUNT } from '../../config';
import UserType = $Enums.UserType;
import {
  EMAIL_ALREADY_VERIFIED,
  EMAIL_VERIFIED_SUCCESSFULLY,
  ERROR_VERIFYING_EMAIL,
} from './apiResponses';

export const deleteBuilderPlace = async (id: string) => {
  try {
    const builderPlace = await prisma.builderPlace.delete({
      where: {
        id: Number(id),
      },
    });

    console.log(builderPlace, 'builderPlace deleted');
    return {
      message: 'BuilderPlace deleted successfully',
      id: builderPlace.id,
    };
  } catch (error: any) {
    console.log('Error deleting the BuilderPlace:', error);
    throw new Error(error.message);
  }
};

export const updateBuilderPlace = async (builderPlace: UpdateBuilderPlace) => {
  try {
    const updatedBuilderPlace = await prisma.builderPlace.update({
      where: {
        ownerId: Number(builderPlace.ownerTalentLayerId),
      },
      data: {
        ...builderPlace,
        palette: { ...builderPlace.palette },
        status: (builderPlace.status as EntityStatus) || EntityStatus.VALIDATED,
      },
    });
    return {
      message: 'BuilderPlace updated successfully',
      id: updatedBuilderPlace.id,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};

export const addBuilderPlaceCollaborator = async (body: AddBuilderPlaceCollaborator) => {
  try {
    const newCollaborator = await prisma.user.findUnique({
      where: {
        address: body.newCollaboratorAddress,
      },
    });

    if (!newCollaborator) {
      throw new Error('Collaborator not found');
    }

    await prisma.builderPlace.update({
      where: {
        id: Number(body.builderPlaceId),
      },
      data: {
        collaborators: {
          connect: [{ id: newCollaborator.id }],
        },
      },
    });

    console.log('Collaborator added successfully', body.newCollaboratorAddress);
    return {
      message: 'Collaborator added successfully',
      address: newCollaborator.address,
      id: newCollaborator.id,
    };
  } catch (error: any) {
    console.log('Error adding collaborator:', error);
    throw new Error(error.message);
  }
};

export const removeBuilderPlaceCollaborator = async (body: RemoveBuilderPlaceCollaborator) => {
  try {
    const collaborator = await prisma.user.findUnique({
      where: {
        address: body.newCollaboratorAddress,
      },
    });

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    await prisma.builderPlace.update({
      where: {
        id: Number(body.builderPlaceId),
      },
      data: {
        collaborators: {
          disconnect: [{ id: collaborator.id }],
        },
      },
    });
    console.log('Collaborator removed successfully', body.newCollaboratorAddress);
    return {
      message: 'Collaborator removed successfully',
      address: collaborator.address,
      id: collaborator.id,
    };
  } catch (error: any) {
    console.log('Error adding collaborator:', error);
    throw new Error(error.message);
  }
};

export const createBuilderPlace = async (data: CreateBuilderPlaceAction) => {
  try {
    const newBuilderPlace = await prisma.builderPlace.create({
      data: {
        name: data.name,
        about: data.about,
        preferredWorkTypes: data.preferredWorkTypes,
        palette: { ...data.palette },
        profilePicture: data.profilePicture,
        status: EntityStatus.PENDING,
      },
    });

    return {
      message: 'BuilderPlace created successfully',
      id: newBuilderPlace.id,
    };
  } catch (error: any) {
    console.log('Error creating new builderPlace:', error);
    throw new Error(error.message);
  }
};

export const getBuilderPlaceByDomain = async (domain: string) => {
  try {
    console.log('getting builderPlace ', domain);
    if (domain.includes(process.env.NEXT_PUBLIC_ROOT_DOMAIN as string)) {
      const builderPlace = await prisma.builderPlace.findFirst({
        where: {
          OR: [{ subdomain: domain }, { customDomain: domain }],
        },
        //TODO check is this still throws an error

        // include: {
        //   owner: true,
        //   collaborators: true,
        // },
      });

      console.log('fetched builderPlaces, ', builderPlace);

      return builderPlace;
    }
  } catch (error: any) {
    console.log('Error fetching the builderPlace:', error);
    throw new Error(error.message);
  }
};

export const getBuilderPlaceById = async (id: string) => {
  try {
    console.log('Getting builderPlace with id:', id);
    const builderPlaceSubdomain = await prisma.builderPlace.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        owner: true,
        collaborators: true,
      },
    });
    console.log('Fetched builderPlace, ', builderPlaceSubdomain);
    if (builderPlaceSubdomain) {
      return builderPlaceSubdomain;
    }
  } catch (error: any) {
    console.log('Error fetching the builderPlace:', error);
    throw new Error(error.message);
  }
};

export const getBuilderPlaceByOwnerId = async (id: string) => {
  try {
    console.log("getting builderPlace with owner's id:", id);
    const builderPlaceSubdomain = await prisma.builderPlace.findFirst({
      where: {
        owner: {
          id: Number(id),
        },
      },
    });
    console.log('fetched builderPlace, ', builderPlaceSubdomain);
    if (builderPlaceSubdomain) {
      return builderPlaceSubdomain;
    }

    return null;
  } catch (error: any) {
    console.log('Error fetching the builderPlace owner:', error);
    throw new Error(error.message);
  }
};

export const getBuilderPlaceByOwnerTalentLayerId = async (id: string) => {
  try {
    console.log("getting builderPlace with owner's id:", id);
    const builderPlaceSubdomain = await prisma.builderPlace.findFirst({
      where: {
        owner: {
          talentLayerId: Number(id),
        },
      },
    });
    console.log('fetched builderPlace, ', builderPlaceSubdomain);
    if (builderPlaceSubdomain) {
      return builderPlaceSubdomain;
    }

    return null;
  } catch (error: any) {
    console.log('Error fetching the builderPlace owner:', error);
    throw new Error(error.message);
  }
};

export const getBuilderPlaceByCollaboratorAddressAndId = async (
  address: string,
  builderPlaceId: string,
) => {
  try {
    console.log('getting builderPlace with admin address & id:', address, builderPlaceId);
    const builderPlaceSubdomain = await prisma.builderPlace.findFirst({
      where: {
        id: Number(builderPlaceId),
        collaborators: {
          some: {
            address: address,
          },
        },
      },
      // select: {
      //   subdomain: true, // assuming you only want the subdomain field
      // },
    });

    console.log('fetched builderPlace, ', builderPlaceSubdomain);
    if (builderPlaceSubdomain) {
      return builderPlaceSubdomain;
    }

    return null;
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};

export const getBuilderPlaceByOwnerTlIdAndId = async (ownerId: string, id: string) => {
  try {
    console.log("getting builderPlace with owner's TlId & mongo _id:", ownerId, id);
    const builderPlaceSubdomain = await prisma.builderPlace.findFirst({
      where: {
        AND: [{ ownerId: Number(ownerId) }, { id: Number(id) }],
      },
      include: {
        owner: true,
        collaborators: true,
      },
    });
    console.log('fetched builderPlace, ', builderPlaceSubdomain);
    if (builderPlaceSubdomain) {
      return builderPlaceSubdomain;
    }

    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// TODO! createBuilderPlace, can be used for the onboarding workflow maybe for the creating the subdomain & deleteBuilderPlace
export const updateDomain = async (builderPlace: UpdateBuilderPlaceDomain) => {
  try {
    console.log('Update Domain invoke, ', builderPlace);
    let response;

    if (builderPlace.customDomain.includes('builder.place')) {
      console.log('Domain contains builder.place');
      return {
        error: 'Cannot use builder.place subdomain as your custom domain',
      };

      // if the custom domain is valid, we need to store it and add it to Vercel
    } else if (validDomainRegex.test(builderPlace.customDomain!)) {
      console.log('Custom Domain is valid');
      // Update the MongoDB document with the new custom domain
      // await BuilderPlace.updateOne({ _id: new mongoose.Types.ObjectId(builderPlace.id) }, { customDomain: builderPlace.customDomain }).exec();
      console.log('Searching subdomain, ', builderPlace.subdomain);
      const updatedEntity = await prisma.builderPlace.update({
        where: {
          subdomain: builderPlace.subdomain,
        },
        data: {
          customDomain: builderPlace.customDomain,
        },
      });
      console.log('Updated entity with custom domain: ', updatedEntity.customDomain);

      // Add the custom domain to Vercel
      console.log('Adding domain to vercel');

      await addDomainToVercel(builderPlace.customDomain!);

      // null means remove the custom domain
    } else if (builderPlace.customDomain! === '') {
      // Remove the custom domain from the MongoDB document
      console.log('Removing custom domain from MongoDB document');
      // await BuilderPlace.updateOne({ _id: new mongoose.Types.ObjectId(builderPlace.id) }, { customDomain: "asd.de" }).exec();

      await prisma.builderPlace.updateMany({
        where: {
          subdomain: builderPlace.subdomain,
        },
        data: {
          customDomain: '',
        },
      });
    }

    // Get the current custom domain from the MongoDB document
    // const currentBuilderPlace = await BuilderPlace.findById(new mongoose.Types.ObjectId(builderPlace.id)).exec();
    const currentBuilderPlace = await prisma.builderPlace.findFirst({
      where: {
        subdomain: builderPlace.subdomain,
      },
    });

    const currentDomain = currentBuilderPlace?.customDomain || '';

    // If the site had a different customDomain before, we need to remove it from Vercel
    if (builderPlace.customDomain !== currentDomain) {
      response = await removeDomainFromVercelProject(builderPlace.customDomain!);

      //TODO check if this works => No Regex in Prisma
      // Check if the apex domain is being used by other sites
      const apexDomain = getApexDomain(`https://${builderPlace.customDomain}`);
      const domainsWithApexDomain = await prisma.builderPlace.findMany({
        where: {
          customDomain: {
            endsWith: `.${apexDomain}`,
          },
        },
      });

      const domainCount = domainsWithApexDomain.length;

      // we should only remove it from our Vercel project
      if (domainCount >= 1) {
        await removeDomainFromVercelProject(builderPlace.customDomain!);
      } else {
        // this is the only site using this apex domain
        // so we can remove it entirely from our Vercel team
        await removeDomainFromVercelTeam(builderPlace.customDomain!);
      }
    }

    return response;
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};

export const setBuilderPlaceOwner = async (data: SetBuilderPlaceOwner) => {
  try {
    await prisma.builderPlace.update({
      where: {
        id: Number(data.id),
      },
      data: {
        ownerId: Number(data.ownerId),
        collaborators: {
          set: { id: Number(data.ownerId) },
        },
      },
    });
    return {
      message: 'BuilderPlace owner set successfully',
      id: data.ownerId,
    };
  } catch (error: any) {
    console.log('Error setting builderPlace owner:', error);
    throw new Error(error.message);
  }
};

export const setUserOwner = async (data: SetHirerProfileOwner) => {
  try {
    await prisma.user.update({
      where: {
        id: Number(data.id),
      },
      data: {
        talentLayerId: Number(data.talentLayerId),
        address: data.hirerAddress,
        //TODO set validated without signature to prove address ? ===> Set it next step
        // status: EntityStatus.VALIDATED,
      },
    });
    return {
      message: 'User owner set successfully',
      id: data.talentLayerId,
    };
  } catch (error: any) {
    console.log('Error setting User owner:', error);
    throw new Error(error.message);
  }
};

export const createWorkerProfile = async (data: CreateWorkerProfileAction) => {
  try {
    // Step 1: Create the User
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        picture: data.picture,
        about: data.about,
        type: UserType.WORKER,
      },
    });

    //TODO add here the creation of the hirer profile or WorkerProfile if any

    // Step 2: Create the WorkerProfile with the same ID as the User
    await prisma.workerProfile.create({
      data: {
        id: user.id,
        skills: data?.skills?.split(','),
      },
    });

    return {
      message: 'Worker Profile created successfully',
      id: user.id,
    };
  } catch (error: any) {
    console.log('Error creating new Worker Profile:', error);
    throw new Error(error.message);
  }
};

//TODO factoriser quand on décide comment on fait
export const createHirerProfile = async (data: CreateHirerProfileAction) => {
  try {
    // Step 1: Create the User
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        picture: data.picture,
        about: data.about,
        type: UserType.HIRER,
      },
    });

    //TODO add here the creation of the hirer profile or WorkerProfile if any

    // Step 2: Create the WorkerProfile with the same ID as the User
    await prisma.hirerProfile.create({
      data: {
        id: user.id,
      },
    });

    return {
      message: 'Hirer Profile created successfully',
      id: user.id,
    };
  } catch (error: any) {
    console.log('Error creating new Hirer Profile:', error);
    throw new Error(error.message);
  }
};

export const getUserById = async (id: string) => {
  try {
    console.log('Getting User Profile with id:', id);
    const userProfile = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        workerProfile: true,
        hirerProfile: true,
        ownedBuilderPlace: true,
        managingPlaces: true,
      },
    });
    console.log('Fetched Worker Profile, ', userProfile);
    if (userProfile) {
      return userProfile;
    }

    return null;
  } catch (error: any) {
    console.log('Error fetching User: ', error);
    throw new Error(error.message);
  }
};

export const getUserByTalentLayerId = async (talentLayerId: string, res?: NextApiResponse) => {
  try {
    console.log('Getting Worker Profile with TalentLayer id:', talentLayerId);
    const userProfile = await prisma.user.findUnique({
      where: {
        talentLayerId: Number(talentLayerId),
      },
      include: {
        workerProfile: true,
        hirerProfile: true,
        ownedBuilderPlace: true,
        managingPlaces: true,
      },
    });
    console.log(userProfile);
    if (!userProfile) {
      return null;
    }

    return userProfile;
  } catch (error: any) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.log(error.message);
    }
    return null;
  }
};

export const getUserByAddress = async (userAddress: string, res?: NextApiResponse) => {
  try {
    console.log('Getting Worker Profile with address:', userAddress);
    const userProfile = await prisma.user.findUnique({
      where: {
        address: userAddress,
      },
      include: {
        workerProfile: true,
        hirerProfile: true,
        ownedBuilderPlace: true,
        managingPlaces: true,
      },
    });
    console.log(userProfile);
    if (!userProfile) {
      return null;
    }

    return userProfile;
  } catch (error: any) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.log(error.message);
    }
    return null;
  }
};

export async function checkUserEmailVerificationStatus(
  user: User,
  res: NextApiResponse,
): Promise<void> {
  if (!user.isEmailVerified) {
    console.log('Email not verified');
    res.status(401).json({ error: 'Email not verified' });
  }
}

export async function checkOrResetTransactionCounter(
  user: User,
  res: NextApiResponse,
): Promise<void> {
  try {
    const nowMilliseconds = new Date().getTime();
    const oneWeekAgoMilliseconds = new Date(nowMilliseconds - 7 * 24 * 60 * 60 * 1000).getTime(); // 7 days ago

    if (user.counterStartDate > oneWeekAgoMilliseconds) {
      // Less than one week since counterStartDate
      if (user.weeklyTransactionCounter >= MAX_TRANSACTION_AMOUNT) {
        // If the counter is already 50, stop the function
        console.log('Transaction limit reached for the week');
        throw new Error('Transaction limit reached for the week');
      }
    } else {
      console.log('More than a week since the start date, reset counter');
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          counterStartDate: nowMilliseconds,
          weeklyTransactionCounter: 0,
        },
      });
    }
    console.log('Delegating transaction');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function incrementWeeklyTransactionCounter(
  user: User,
  res: NextApiResponse,
): Promise<void> {
  try {
    // Increment the counter
    const newWeeklyTransactionCounter = (user.weeklyTransactionCounter || 0) + 1;
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        weeklyTransactionCounter: newWeeklyTransactionCounter,
      },
    });
    console.log('Transaction counter incremented', newWeeklyTransactionCounter);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export const verifyWorkerProfileEmail = async (id: string) => {
  try {
    await connection();
    const existingWorker = await Worker.findOne({ _id: id });
    if (existingWorker) {
      const resp = await Worker.updateOne({ _id: id }, { emailVerified: true }).exec();
      if (resp.modifiedCount === 0 && resp.matchedCount === 1) {
        console.log(EMAIL_ALREADY_VERIFIED);
        return {
          error: EMAIL_ALREADY_VERIFIED,
        };
      }
      console.log('Updated worker profile email', resp);
    } else {
      console.log(ERROR_VERIFYING_EMAIL);
      return {
        error: ERROR_VERIFYING_EMAIL,
      };
    }
    return {
      message: EMAIL_VERIFIED_SUCCESSFULLY,
      email: existingWorker.email,
    };
  } catch (error: any) {
    console.log(error.message);
    return {
      error: error.message,
    };
  }
};

// export const validateUserEmail = async (userId: string, email: string) => {
//   try {
//     const resp = await prisma.user.update({
//       where: {
//         email: email,
//         talentLayerId: Number(userId),
//       },
//       data: {
//         isEmailVerified: true,
//       },
//     });
//     console.log('Updated worker profile email', resp.id, resp.name, resp.email);
//     return {
//       message: 'Email verified successfully',
//     };
//   } catch (error: any) {
//     return {
//       error: error.message,
//     };
//   }
// };
