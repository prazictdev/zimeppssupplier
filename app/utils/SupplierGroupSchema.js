import * as yup from 'yup';
export const SupplierGroupSchema = yup.object().shape({
  code: yup.string().required('Code is required').max(50),
  name: yup.string().required('Name is required').max(255),
  accessible: yup.string().required('Accessibility is required').oneOf(['localonly', 'foreignonly', 'all']),
});
