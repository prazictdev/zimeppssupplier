import * as yup from 'yup';
export const CompanySubcategorySchema = yup.object().shape({
  companycategory_id: yup
    .number()
    .typeError('Category is required')
    .required('Category is required'),
  name: yup.string().required('Name is required').max(255),
});
