import * as yup from 'yup';
export const SupplierCategorySchema = yup.object().shape({
  code: yup.string().required('Code is required').max(50),
  name: yup.string().required('Name is required').max(255),
  suppliersection_id: yup
    .number()
    .typeError('Supplier section is required')
    .required('Supplier section is required'),
});
