import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik';
import SubdomainInput from '../Form/SubdomainInput';
import UploadImage from '../UploadImage';
import DefaultPalettes from '../DefaultPalettes';
import { themes } from '../../utils/themes';
import CustomizePalette from '../CustomizePalette';
import { slugify } from '../../modules/BuilderPlace/utils';
import { iBuilderPlacePalette } from '../../modules/BuilderPlace/types';
import { IMutation, JobPostingConditions } from '../../types';
import * as Yup from 'yup';
import { useContext, useState } from 'react';
import TalentLayerContext from '../../context/talentLayer';
import BuilderPlaceContext from '../../modules/BuilderPlace/context/BuilderPlaceContext';
import { useChainId, useWalletClient } from 'wagmi';
import { useColor } from 'react-color-palette';
import { showErrorTransactionToast } from '../../utils/toast';
import useUpdatePlatform from '../../modules/BuilderPlace/hooks/platform/useUpdatePlatform';
import { isAddress } from 'viem';

export interface IConfigurePlaceFormValues {
  subdomain: string;
  palette?: iBuilderPlacePalette;
  logo?: string;
  name: string;
  baseline: string;
  about: string;
  aboutTech: string;
  icon?: string;
  cover?: string;
  jobPostingConditions?: JobPostingConditions;
  tempFormValues?: tempFormValues;
}

interface tempFormValues {
  tempNftAddress?: string;
  tempTokenAddress?: string;
  tempTokenAmount?: number;
}

export interface IConfigurePlace
  extends IMutation<
    Omit<IConfigurePlaceFormValues, keyof tempFormValues> & {
      builderPlaceId: string;
    }
  > {}

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const validationSchema = Yup.object({
  subdomain: Yup.string().required('Subdomain is required'),

  tempFormValues: Yup.object({
    tempNftAddress: Yup.string().matches(ethAddressRegex, 'Invalid Ethereum address').notRequired(),

    tempTokenAddress: Yup.string()
      .matches(ethAddressRegex, 'Invalid Ethereum address')
      .notRequired(),

    tempTokenAmount: Yup.number().positive('Amount must be positive').notRequired(),
  }),
});

const ConfigurePlatformForm = () => {
  const { builderPlace } = useContext(BuilderPlaceContext);
  const chainId = useChainId();
  const [palette, setPalette] = useState<iBuilderPlacePalette | undefined>(builderPlace?.palette);
  const [colorName, setColorName] = useState('primary');
  const [color, setColor] = useColor(
    palette ? palette[colorName as keyof iBuilderPlacePalette] : '#FF71A2',
  );
  const { account, loading } = useContext(TalentLayerContext);
  const { data: walletClient } = useWalletClient({ chainId });
  const { updatePlatform } = useUpdatePlatform();
  const [tempFormErrors, setTempFormErrors] = useState({
    tempNftAddress: '',
    tempTokenAddress: '',
    tempTokenAmount: '',
  });

  const initialValues: IConfigurePlaceFormValues = {
    subdomain:
      builderPlace?.subdomain?.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN as string}`, '') ||
      (builderPlace?.name && slugify(builderPlace.name)) ||
      '',
    logo: builderPlace?.logo || '',
    palette,
    name: builderPlace?.name || '',
    baseline: builderPlace?.baseline || '',
    about: builderPlace?.about || '',
    aboutTech: builderPlace?.aboutTech || '',
    icon: builderPlace?.icon || '',
    cover: builderPlace?.cover || '',
    jobPostingConditions: builderPlace?.jobPostingConditions || {
      allowPosts: false,
      conditions: [],
    },
    tempFormValues: {
      tempNftAddress: '',
      tempTokenAddress: '',
      tempTokenAmount: 0,
    },
  };

  const handleSubmit = async (
    values: IConfigurePlaceFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    console.log('values', values);
    if (walletClient && account?.address && builderPlace) {
      try {
        setSubmitting(true);
        await updatePlatform(values);
      } catch (error: any) {
        console.log('CATCH error', error);
        showErrorTransactionToast(error.message);
      } finally {
        setTimeout(() => {
          setSubmitting(false);
        }, 1000);
      }
    }
  };

  function addJobPostingConditions(
    push: (obj: any) => void,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void,
    jobCondition: {
      address?: string;
      minimumAmount?: number;
      type: 'NFT' | 'Token';
    },
  ) {
    setTempFormErrors({ tempNftAddress: '', tempTokenAddress: '', tempTokenAmount: '' });
    const errors = { ...tempFormErrors };
    let hasError = false;

    if (jobCondition.type === 'NFT') {
      if (jobCondition.address && !isAddress(jobCondition.address)) {
        errors.tempNftAddress = 'Invalid Ethereum address';
        hasError = true;
      } else {
        errors.tempNftAddress = '';
      }
    }
    if (jobCondition.type === 'Token') {
      if (jobCondition.address && !isAddress(jobCondition.address)) {
        errors.tempTokenAddress = 'Invalid Ethereum address';
        hasError = true;
      } else {
        errors.tempTokenAddress = '';
      }
      if (jobCondition?.minimumAmount && jobCondition.minimumAmount <= 0) {
        errors.tempTokenAmount = 'Amount must be positive';
        hasError = true;
      } else {
        errors.tempTokenAmount = '';
      }
    }

    if (hasError) {
      setTempFormErrors(errors);
      return;
    } else {
      push(jobCondition);
      if (jobCondition.type === 'NFT') {
        setFieldValue('tempFormValues.tempNftAddress', '');
        setTempFormErrors({ ...errors, tempNftAddress: '' });
      }
      if (jobCondition.type === 'Token') {
        setFieldValue('tempFormValues.tempTokenAmount', 0);
        setFieldValue('tempFormValues.tempTokenAddress', '');
        setTempFormErrors({ ...errors, tempTokenAddress: '', tempTokenAmount: '' });
      }
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}>
      {({ isSubmitting, setFieldValue, values }) => (
        <Form>
          <div className='grid grid-cols-1 gap-6'>
            <div>
              <label className='block'>
                <span className='font-bold text-md'>organization name</span>
                <Field
                  type='text'
                  id='name'
                  name='name'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                  placeholder='your organization name goes here'
                />
              </label>
              <span className='text-red-500'>
                <ErrorMessage name='name' />
              </span>
            </div>

            <div>
              <label className='block'>
                <span className='font-bold text-md'>organization baseline</span>
                <Field
                  type='text'
                  id='baseline'
                  name='baseline'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                  placeholder='your organization baseline'
                />
              </label>
              <span className='text-red-500'>
                <ErrorMessage name='baseline' />
              </span>
            </div>

            <div>
              <label className='block'>
                <span className='font-bold text-md'>about your organization</span>
                <Field
                  as='textarea'
                  id='about'
                  name='about'
                  rows='9'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                  placeholder='tell everyone about what you work on and why you’re doing it (ps: open-source contributors love to hear about your mission and vision)'
                />
              </label>
              <p className='font-alt text-xs font-normal opacity-60'>
                <span className='text-base-content'>
                  This supports markdown format. Learn more about how to write markdown{' '}
                  <a
                    href='https://stackedit.io/app#'
                    target='_blank'
                    className='underline text-info'>
                    here
                  </a>
                  .
                </span>
              </p>
              <span className='text-red-500'>
                <ErrorMessage name='about' />
              </span>
            </div>

            <div>
              <label className='block'>
                <span className='font-bold text-md'>about your tech</span>
                <Field
                  as='textarea'
                  id='aboutTech'
                  name='aboutTech'
                  rows='9'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                />
              </label>
              <p className='font-alt text-xs font-normal opacity-60'>
                <span className='text-base-content'>
                  This supports markdown format. Learn more about how to write markdown{' '}
                  <a
                    href='https://stackedit.io/app#'
                    target='_blank'
                    className='underline text-info'>
                    here
                  </a>
                  .
                </span>
              </p>
              <span className='text-red-500'>
                <ErrorMessage name='aboutTech' />
              </span>
            </div>

            <SubdomainInput />

            <UploadImage
              fieldName='logo'
              label='logo'
              legend='rectangle format, used in top of your place'
              src={values.logo}
              setFieldValue={setFieldValue}
            />

            <UploadImage
              fieldName='icon'
              label='icon'
              legend='square format'
              src={values.icon}
              setFieldValue={setFieldValue}
            />

            <UploadImage
              fieldName='cover'
              label='cover'
              legend='large rectangle format, used in top of your place'
              src={values.cover}
              setFieldValue={setFieldValue}
            />

            <DefaultPalettes
              onChange={palette => {
                setPalette(themes[palette as keyof typeof themes]);
              }}
            />

            {palette && (
              <CustomizePalette
                palette={palette}
                color={color}
                setColor={setColor}
                setColorName={setColorName}
              />
            )}

            <div>
              <label className='block'>
                <span className='font-bold text-md'>Posting conditions</span>
              </label>

              <FieldArray name='jobPostingConditions.conditions'>
                {({ push, remove }) => (
                  <div className='mb-2'>
                    <label>
                      <Field type='checkbox' name='jobPostingConditions.allowPosts' />
                      Allow Posts
                    </label>

                    {values.jobPostingConditions?.allowPosts && (
                      <>
                        <div className='flex mb-2'>
                          <Field
                            type='text'
                            name='tempFormValues.tempNftAddress'
                            placeholder='NFT Address'
                            className='rounded border px-2 py-1 mr-2'
                          />
                          <button
                            type='button'
                            onClick={() => {
                              addJobPostingConditions(push, setFieldValue, {
                                type: 'NFT',
                                address: values?.tempFormValues?.tempNftAddress,
                              });
                            }}>
                            Add NFT Condition
                          </button>
                          {tempFormErrors.tempNftAddress && (
                            <span className='text-red-500'>{tempFormErrors.tempNftAddress}</span>
                          )}
                        </div>

                        <div className='flex mb-2'>
                          <Field
                            type='text'
                            name='tempFormValues.tempTokenAddress'
                            placeholder='Token Address'
                            className='rounded border px-2 py-1 mr-2'
                          />
                          <Field
                            type='number'
                            name='tempFormValues.tempTokenAmount'
                            placeholder='Minimum Amount'
                            className='rounded border px-2 py-1 mr-2'
                          />
                          <button
                            type='button'
                            onClick={() => {
                              addJobPostingConditions(push, setFieldValue, {
                                type: 'Token',
                                address: values?.tempFormValues?.tempTokenAddress,
                                minimumAmount: values?.tempFormValues?.tempTokenAmount,
                              });
                            }}>
                            Add Token Condition
                          </button>

                          {tempFormErrors.tempTokenAddress && (
                            <span className='text-red-500'>{tempFormErrors.tempTokenAddress}</span>
                          )}
                          {tempFormErrors.tempTokenAmount && (
                            <span className='text-red-500'>{tempFormErrors.tempTokenAmount}</span>
                          )}
                        </div>

                        {values.jobPostingConditions?.conditions?.map((condition, index) => (
                          <div className='flex items-center mb-2' key={index}>
                            <div className='flex-1'>
                              {condition.type === 'NFT' ? (
                                <span>NFT Address: {condition.address}</span>
                              ) : (
                                <>
                                  <span>Token Address: {condition.address}</span>
                                  <span> - Minimum Amount: {condition.minimumAmount}</span>
                                </>
                              )}
                            </div>
                            <button type='button' onClick={() => remove(index)} className='ml-2'>
                              Delete
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </FieldArray>

              <p className='font-alt text-xs font-normal opacity-60'>
                <span className='text-base-content'>
                  Gougougaga
                  <a
                    href='https://stackedit.io/app#'
                    target='_blank'
                    className='underline text-info'>
                    here
                  </a>
                  .
                </span>
              </p>
              {/*<span className='text-red-500'>*/}
              {/*  <ErrorMessage name='tempFormValues' />*/}
              {/*</span>*/}
            </div>

            {isSubmitting ? (
              <button
                disabled
                type='submit'
                className='grow px-5 py-2 rounded-xl bg-primary-50 text-primary'>
                Loading...
              </button>
            ) : (
              <button type='submit' className='grow px-5 py-2 rounded-xl bg-primary text-primary'>
                Sign and validate
              </button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ConfigurePlatformForm;
