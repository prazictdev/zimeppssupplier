import * as yup from 'yup';

export const SupplierGroupThresholdSchema = yup.object().shape({
  suppliergroup_id: yup.number().required('Supplier group is required').positive().integer(),
  procurementgroup_id: yup.number().required('Procurement group is required').positive().integer(),
  procurementmethod_id: yup.number().required('Procurement method is required').positive().integer(),
  currency_id: yup.number().required('Currency is required').positive().integer(),
  lower_limit: yup.number().required('Lower limit is required').min(0, 'Lower limit must be 0 or greater'),
  upper_limit: yup
    .number()
    .required('Upper limit is required')
    .min(0, 'Upper limit must be 0 or greater')
    .test('gte-lower', 'Upper limit must be greater than or equal to lower limit', function (value) {
      return value >= this.parent.lower_limit;
    }),
});
