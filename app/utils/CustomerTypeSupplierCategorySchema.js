import * as yup from 'yup';

export const CustomerTypeSupplierCategorySchema = yup.object({
  customertype_id:    yup.number().required('Customer type is required').integer().positive(),
  suppliercategory_id: yup.number().required('Supplier category is required').integer().positive(),
});
