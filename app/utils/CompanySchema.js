import * as yup from 'yup';
export const CompanySchema = yup.object().shape({
  name: yup.string().required('Name is required').max(255),
  regnumber: yup.string().nullable().max(255),
  company_number: yup.string().nullable().max(255),
  country: yup.string().required('Country is required').max(255),
  companycategory_id: yup
    .number()
    .typeError('Company category is required')
    .integer('Company category is required')
    .required('Company category is required'),
  companysubcategory_id: yup
    .number()
    .typeError('Company subcategory is required')
    .integer('Company subcategory is required')
    .required('Company subcategory is required'),
  companyindustry_id: yup
    .number()
    .typeError('Company industry is required')
    .integer('Company industry is required')
    .required('Company industry is required'),
  province_id: yup
    .number()
    .typeError('Province is required')
    .integer('Province is required')
    .required('Province is required'),
  district_id: yup
    .number()
    .typeError('District is required')
    .integer('District is required')
    .required('District is required'),
  city: yup.string().required('City is required').max(255),
  address: yup.string().required('Address is required').max(255),
  phone: yup.string().required('Phone is required').max(255),
  email: yup.string().email('Enter a valid email').required('Email is required').max(255),
  website: yup.string().required('Website is required').max(255),
  accounttypes: yup
    .array()
    .of(yup.number().integer('Invalid account type'))
    .min(1, 'Please select at least one account type')
    .required('Please select at least one account type'),
});
