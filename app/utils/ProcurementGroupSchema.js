import * as yup from 'yup';

export const ProcurementGroupSchema = yup.object({
  code: yup.string().required('Code is required').max(50, 'Code must be at most 50 characters'),
  name: yup.string().required('Name is required').max(255, 'Name must be at most 255 characters'),
});
