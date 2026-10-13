import * as yup from 'yup';

export const CurrencySchema = yup.object({
  code:   yup.string().required('Code is required').max(10, 'Code must be at most 10 characters'),
  name:   yup.string().required('Name is required').max(255, 'Name must be at most 255 characters'),
  symbol: yup.string().required('Symbol is required').max(10, 'Symbol must be at most 10 characters'),
});
