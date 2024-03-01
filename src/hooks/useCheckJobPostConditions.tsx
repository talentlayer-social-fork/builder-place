import { useContext, useEffect, useMemo, useState } from 'react';
import { MenuItem, workerNavigation } from '../components/Layout/navigation';
import { PostingCondition } from '../modules/BuilderPlace/types';
import { Abi } from 'viem';
import { erc20ABI, erc721ABI } from 'wagmi';
import TalentLayerContext from '../context/talentLayer';
import { generateClients } from '../utils/jobPostConditions';

export interface IReturnPostingCondition {
  condition: PostingCondition;
  validated: boolean;
}

const useCheckJobPostConditions = (
  isPostingAllowed: boolean = false,
  jobPostConditions?: PostingCondition[],
): {
  isLoading: boolean;
  returnedPostingConditions: IReturnPostingCondition[];
  canPost: boolean;
} => {
  const { account } = useContext(TalentLayerContext);
  const [isLoading, setIsLoading] = useState(true);
  const [canPost, setCanPost] = useState<boolean>(false);
  useState<MenuItem[]>(workerNavigation);
  const [returnedPostingConditions, setReturnedPostingConditions] = useState<
    IReturnPostingCondition[]
  >([]);

  const chainIdSet = useMemo(() => {
    const set = new Set<number>();
    jobPostConditions?.forEach(condition => set.add(Number(condition.chainId)));
    return set;
  }, [jobPostConditions]);

  const clients = generateClients(chainIdSet);

  useEffect(() => {
    const checkConditions = async () => {
      setIsLoading(true);
      if (
        !isPostingAllowed ||
        !jobPostConditions ||
        jobPostConditions.length === 0 ||
        !account?.address
      ) {
        setCanPost(false);
        setIsLoading(false);
        return;
      }

      let allConditionsMet = true;
      const allConditions: IReturnPostingCondition[] = [];

      for (const condition of jobPostConditions) {
        try {
          const client = clients.get(Number(condition.chainId));
          let data: bigint = 0n;

          if (!client) {
            console.log('Client not found');
            allConditionsMet = false;
            continue;
          }

          let validated = false;
          if (condition.type === 'NFT') {
            data = await client.readContract({
              address: condition.address as `0x${string}`,
              abi: erc721ABI,
              functionName: 'balanceOf',
              args: [account.address],
            });
            validated = data > 0n;
          } else if (condition.type === 'Token') {
            data = await client.readContract({
              address: condition.address as `0x${string}`,
              abi: erc20ABI,
              functionName: 'balanceOf',
              args: [account.address],
            });
            validated = data > BigInt(condition.parsedMinimumAmount);
          }

          allConditions.push({ condition, validated });
          if (!validated) allConditionsMet = false;
        } catch (error) {
          console.error('Error checking posting conditions', error);
          setCanPost(false);
        }
      }

      setCanPost(allConditionsMet);
      setReturnedPostingConditions(allConditions);
      setIsLoading(false);
    };
    checkConditions();
  }, [isPostingAllowed, jobPostConditions]);

  return {
    isLoading,
    returnedPostingConditions,
    canPost,
  };
};

export default useCheckJobPostConditions;