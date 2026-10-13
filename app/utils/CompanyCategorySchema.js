import * as yup from 'yup';
export const CompanyCategorySchema = yup.object().shape({
  name: yup.string().required('Name is required').max(255),
});
