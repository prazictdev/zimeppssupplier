import * as yup from 'yup';

export const OrganisationSetupSchema = yup.object().shape({
  name: yup.string().required('Organisation name is required').max(255),
  regnumber: yup.string().nullable().max(100),
  company_number: yup.string().nullable().max(100),
  email: yup.string().email('Enter a valid email address').nullable().max(255),
  phone: yup.string().nullable().max(50),
  website: yup.string().url('Enter a valid URL').nullable().max(255),
  country: yup.string().nullable().max(100),
  province_id: yup.number().nullable(),
  district_id: yup.number().nullable(),
  city: yup.string().nullable().max(100),
  address: yup.string().nullable().max(500),
  companyindustry_id: yup.number().nullable(),
  customertype_id: yup.number().required('Please select a customer type').typeError('Please select a customer type'),
  suppliergroup_id: yup.number().required('Please select a supplier group').typeError('Please select a supplier group'),
});
