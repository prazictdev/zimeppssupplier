import * as yup from 'yup';

export const CustomerTypeDocumentSchema = yup.object({
  customertype_id: yup.number().required('Customer type is required').integer().positive(),
  document_id:     yup.number().required('Document is required').integer().positive(),
  locality:        yup.string().required('Locality is required').oneOf(['local', 'foreign'], 'Locality must be local or foreign'),
});
