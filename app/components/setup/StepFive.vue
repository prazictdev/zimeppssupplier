<template>
  <div class="space-y-6">

    <!-- Business Portfolio card -->
    <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Icon name="lucide:briefcase" class="w-5 h-5" />
          </span>
          <div>
            <h2 class="text-sm font-bold text-base-content">Business Portfolio</h2>
            <p class="text-xs text-base-content/50">Describe your business, when it was established, and how many branches you operate.</p>
          </div>
        </div>
        <button v-if="!portfolioSaved && !editingPortfolio" type="button" class="btn btn-primary btn-sm gap-1" @click="startPortfolioForm">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Add Details
        </button>
      </div>

      <!-- Saved read-only view -->
      <div v-if="portfolioSaved && !editingPortfolio" class="p-6">
        <table class="table table-sm w-full">
          <tbody>
            <tr>
              <th class="text-xs text-base-content/50 w-40 align-top">Business Description</th>
              <td class="text-sm whitespace-pre-wrap">{{ portfolioForm.business_description }}</td>
            </tr>
            <tr>
              <th class="text-xs text-base-content/50 align-top">Date Established</th>
              <td class="text-sm">
                {{ portfolioForm.date_established }}
                <span v-if="yearsInBusiness !== null" class="text-base-content/50 ml-1">
                  ({{ yearsInBusiness === 0 ? 'less than 1 year' : yearsInBusiness === 1 ? '1 year in business' : `${yearsInBusiness} years in business` }})
                </span>
              </td>
            </tr>
            <tr>
              <th class="text-xs text-base-content/50 align-top">Branches</th>
              <td class="text-sm">{{ portfolioForm.branches }}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-ghost btn-sm text-info gap-1" @click="startPortfolioForm">
            <Icon name="lucide:edit" class="w-4 h-4" />
            Edit
          </button>
          <button type="button" class="btn btn-ghost btn-sm text-error gap-1" :disabled="deletingPortfolio" @click="confirmDeletePortfolio">
            <span v-if="deletingPortfolio" class="loading loading-spinner loading-xs"></span>
            <Icon v-else name="lucide:trash-2" class="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <!-- Add / Edit form -->
      <div v-else-if="editingPortfolio" class="p-6 space-y-5">
        <div v-if="portfolioError" role="alert" class="alert alert-error alert-soft text-sm">
          <Icon name="lucide:alert-circle" class="w-4 h-4" />
          {{ portfolioError }}
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Business Description <span class="text-error">*</span></legend>
          <textarea
            v-model.trim="portfolioForm.business_description"
            :class="['textarea textarea-bordered w-full resize-none', portfolioErrors.business_description || descriptionWordCount > 500 ? 'textarea-error' : '']"
            rows="4"
            placeholder="Briefly describe what your organisation does, its mission, and key capabilities."
          ></textarea>
          <label class="label">
            <span v-if="portfolioErrors.business_description" class="label-text-alt text-error">{{ portfolioErrors.business_description }}</span>
            <span v-else-if="descriptionWordCount > 500" class="label-text-alt text-error">Word limit exceeded</span>
            <span v-else class="label-text-alt invisible">placeholder</span>
            <span :class="['label-text-alt tabular-nums', descriptionWordCount > 500 ? 'text-error font-semibold' : 'text-base-content/40']">
              {{ descriptionWordCount }} / 500 words
            </span>
          </label>
        </fieldset>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Date Established <span class="text-error">*</span></legend>
            <input
              v-model="portfolioForm.date_established"
              type="date"
              :max="today"
              :class="['input input-bordered w-full', portfolioErrors.date_established ? 'input-error' : '']"
            />
            <label v-if="portfolioErrors.date_established" class="label">
              <span class="label-text-alt text-error">{{ portfolioErrors.date_established }}</span>
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Number of Branches <span class="text-error">*</span></legend>
            <input
              v-model="portfolioForm.branches"
              type="number"
              min="1"
              step="1"
              :class="['input input-bordered w-full', portfolioErrors.branches ? 'input-error' : '']"
              placeholder="1"
            />
            <label v-if="portfolioErrors.branches" class="label">
              <span class="label-text-alt text-error">{{ portfolioErrors.branches }}</span>
            </label>
          </fieldset>
        </div>

        <div class="flex justify-end gap-2">
          <button v-if="portfolioSaved" type="button" class="btn btn-ghost btn-sm" @click="cancelPortfolioEdit">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="savingPortfolio" @click="savePortfolioDetails">
            <span v-if="savingPortfolio" class="loading loading-spinner loading-xs"></span>
            <Icon v-else name="lucide:save" class="w-4 h-4" />
            {{ portfolioSaved ? 'Update Portfolio' : 'Save Portfolio' }}
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-10 text-base-content/40 text-sm">
        No portfolio details added yet. Click "Add Details" to get started.
      </div>
    </div>

    <!-- Products / Services card -->
    <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Icon name="lucide:layers" class="w-5 h-5" />
          </span>
          <div>
            <h2 class="text-sm font-bold text-base-content">Products / Services</h2>
            <p class="text-xs text-base-content/50">List the products or services your organisation offers.</p>
          </div>
        </div>
        <button type="button" class="btn btn-info btn-sm gap-1" @click="openProductModal()">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <div v-else-if="!products.length" class="text-center py-10 text-base-content/40 text-sm">
          No products or services added yet. Click "Add Product" to get started.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50">
                <th>Product / Service</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id" class="text-sm">
                <td class="font-medium align-top">{{ product.product_name }}</td>
                <td class="text-base-content/70 align-top max-w-xs">{{ product.description }}</td>
                <td class="text-right align-top">
                  <div class="flex justify-end gap-1">
                    <button type="button" class="btn btn-ghost btn-xs text-info" @click="openProductModal(product)">
                      <Icon name="lucide:edit" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs text-error"
                      :disabled="deletingProduct === product.id"
                      @click="deleteProduct(product.id)"
                    >
                      <span v-if="deletingProduct === product.id" class="loading loading-spinner loading-xs"></span>
                      <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Completed Orders card -->
    <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Icon name="lucide:package-check" class="w-5 h-5" />
          </span>
          <div>
            <h2 class="text-sm font-bold text-base-content">Completed Orders</h2>
            <p class="text-xs text-base-content/50">Record past orders to demonstrate your track record.</p>
          </div>
        </div>
        <button type="button" class="btn btn-success btn-sm gap-1" @click="openOrderModal()">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Add Order
        </button>
      </div>

      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <div v-else-if="!orders.length" class="text-center py-10 text-base-content/40 text-sm">
          No completed orders added yet. Click "Add Order" to get started.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50">
                <th>Description</th>
                <th class="text-center">Currency</th>
                <th class="text-right">Value</th>
                <th class="text-right">Year</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id" class="text-sm">
                <td class="font-medium align-top">{{ order.order_description }}</td>
                <td class="text-center align-top">
                  <span class="badge badge-sm badge-ghost">{{ order.currency?.code ?? '—' }}</span>
                </td>
                <td class="text-right font-mono align-top">{{ formatMoney(order.value) }}</td>
                <td class="text-right align-top">{{ order.year }}</td>
                <td class="text-right align-top">
                  <div class="flex justify-end gap-1">
                    <button type="button" class="btn btn-ghost btn-xs text-info" @click="openOrderModal(order)">
                      <Icon name="lucide:edit" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs text-error"
                      :disabled="deletingOrder === order.id"
                      @click="deleteOrder(order.id)"
                    >
                      <span v-if="deletingOrder === order.id" class="loading loading-spinner loading-xs"></span>
                      <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="orders.length">
              <tr class="text-xs font-semibold text-base-content/60 border-t border-base-200">
                <td colspan="2" class="text-right pt-2">Total value:</td>
                <td class="text-right pt-2 font-mono text-base-content">{{ formatMoney(totalOrderValue) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Add / Edit product modal -->
  <dialog ref="productModalRef" class="modal">
    <div class="modal-box max-w-lg">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-bold text-base">{{ editingProduct ? 'Edit Product / Service' : 'Add Product / Service' }}</h3>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" @click="closeProductModal">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="productServerError" role="alert" class="alert alert-error alert-soft mb-4 text-sm">
        <Icon name="lucide:alert-circle" class="w-4 h-4" />
        {{ productServerError }}
      </div>

      <div class="space-y-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Product / Service Name <span class="text-error">*</span></legend>
          <input
            v-model.trim="productForm.product_name"
            type="text"
            :class="['input input-bordered w-full', productErrors.product_name ? 'input-error' : '']"
            placeholder="e.g. IT Equipment Supply"
          />
          <label v-if="productErrors.product_name" class="label">
            <span class="label-text-alt text-error">{{ productErrors.product_name }}</span>
          </label>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Description <span class="text-error">*</span></legend>
          <textarea
            v-model.trim="productForm.description"
            :class="['textarea textarea-bordered w-full resize-none', productErrors.description ? 'textarea-error' : '']"
            rows="3"
            placeholder="Describe the product or service in detail."
          ></textarea>
          <label v-if="productErrors.description" class="label">
            <span class="label-text-alt text-error">{{ productErrors.description }}</span>
          </label>
        </fieldset>
      </div>

      <div class="modal-action mt-6">
        <button type="button" class="btn btn-ghost" @click="closeProductModal">Cancel</button>
        <button type="button" class="btn btn-info" :disabled="savingProduct" @click="submitProduct">
          <span v-if="savingProduct" class="loading loading-spinner loading-xs"></span>
          {{ editingProduct ? 'Save Changes' : 'Add Product' }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- Add / Edit order modal -->
  <dialog ref="orderModalRef" class="modal">
    <div class="modal-box max-w-lg">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-bold text-base">{{ editingOrder ? 'Edit Order' : 'Add Completed Order' }}</h3>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" @click="closeOrderModal">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="orderServerError" role="alert" class="alert alert-error alert-soft mb-4 text-sm">
        <Icon name="lucide:alert-circle" class="w-4 h-4" />
        {{ orderServerError }}
      </div>

      <div class="space-y-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Order Description <span class="text-error">*</span></legend>
          <textarea
            v-model.trim="orderForm.order_description"
            :class="['textarea textarea-bordered w-full resize-none', orderErrors.order_description ? 'textarea-error' : '']"
            rows="3"
            placeholder="Describe what was supplied and to whom."
          ></textarea>
          <label v-if="orderErrors.order_description" class="label">
            <span class="label-text-alt text-error">{{ orderErrors.order_description }}</span>
          </label>
        </fieldset>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Currency <span class="text-error">*</span></legend>
            <select
              v-model="orderForm.currency_id"
              :class="['select select-bordered w-full', orderErrors.currency_id ? 'select-error' : '']"
            >
              <option :value="null">Select</option>
              <option v-for="c in currencies" :key="c.id" :value="c.id">{{ c.code }}</option>
            </select>
            <label v-if="orderErrors.currency_id" class="label">
              <span class="label-text-alt text-error">{{ orderErrors.currency_id }}</span>
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Value <span class="text-error">*</span></legend>
            <input
              v-model="orderForm.value"
              type="number"
              min="0"
              step="0.01"
              :class="['input input-bordered w-full', orderErrors.value ? 'input-error' : '']"
              placeholder="0.00"
            />
            <label v-if="orderErrors.value" class="label">
              <span class="label-text-alt text-error">{{ orderErrors.value }}</span>
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Year <span class="text-error">*</span></legend>
            <input
              v-model="orderForm.year"
              type="number"
              min="1900"
              :max="currentYear"
              step="1"
              :class="['input input-bordered w-full', orderErrors.year ? 'input-error' : '']"
              :placeholder="currentYear"
            />
            <label v-if="orderErrors.year" class="label">
              <span class="label-text-alt text-error">{{ orderErrors.year }}</span>
            </label>
          </fieldset>
        </div>
      </div>

      <div class="modal-action mt-6">
        <button type="button" class="btn btn-ghost" @click="closeOrderModal">Cancel</button>
        <button type="button" class="btn btn-success" :disabled="savingOrder" @click="submitOrder">
          <span v-if="savingOrder" class="loading loading-spinner loading-xs"></span>
          {{ editingOrder ? 'Save Changes' : 'Add Order' }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup>
const props = defineProps({
  companyId: { type: Number, default: null },
});

const { getPortfolio, savePortfolio, deletePortfolio, addProduct, updateProduct, removeProduct, addOrder, updateOrder, removeOrder } =
  useCompanyPortfolioHelper();
const { getActiveCurrencies } = useCurrencyHelper();
const toast = useToast();

const today = new Date().toISOString().split('T')[0];
const currentYear = new Date().getFullYear();

// ── Loading ───────────────────────────────────────────────────────────────────
const loading = ref(false);
const currencies = ref([]);

// ── Portfolio details ─────────────────────────────────────────────────────────
const savingPortfolio = ref(false);
const deletingPortfolio = ref(false);
const portfolioSaved = ref(false);
const editingPortfolio = ref(false);
const portfolioError = ref('');
const portfolioForm = reactive({ business_description: '', date_established: '', branches: 1 });
const portfolioErrors = reactive({ business_description: '', date_established: '', branches: '' });

const startPortfolioForm = () => { portfolioError.value = ''; clearPortfolioErrors(); editingPortfolio.value = true; };
const cancelPortfolioEdit = () => { editingPortfolio.value = false; clearPortfolioErrors(); portfolioError.value = ''; };

const descriptionWordCount = computed(() => {
  const text = portfolioForm.business_description.trim();
  return text ? text.split(/\s+/).length : 0;
});

const yearsInBusiness = computed(() => {
  if (!portfolioForm.date_established) return null;
  const established = new Date(portfolioForm.date_established);
  if (isNaN(established.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - established.getFullYear();
  const monthDiff = now.getMonth() - established.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < established.getDate())) years--;
  return Math.max(0, years);
});

const clearPortfolioErrors = () => Object.keys(portfolioErrors).forEach((k) => (portfolioErrors[k] = ''));

const validatePortfolio = () => {
  clearPortfolioErrors();
  let valid = true;
  if (!portfolioForm.business_description.trim()) {
    portfolioErrors.business_description = 'Business description is required';
    valid = false;
  } else if (descriptionWordCount.value > 500) {
    portfolioErrors.business_description = 'Business description must not exceed 500 words';
    valid = false;
  }
  if (!portfolioForm.date_established) {
    portfolioErrors.date_established = 'Date established is required';
    valid = false;
  }
  if (!portfolioForm.branches || Number(portfolioForm.branches) < 1) {
    portfolioErrors.branches = 'At least 1 branch is required';
    valid = false;
  }
  return valid;
};

const savePortfolioDetails = async () => {
  if (!validatePortfolio()) return;
  savingPortfolio.value = true;
  portfolioError.value = '';
  const { ok, error } = await savePortfolio(props.companyId, { ...portfolioForm });
  savingPortfolio.value = false;
  if (!ok) { portfolioError.value = error; return; }
  portfolioSaved.value = true;
  editingPortfolio.value = false;
  toast.success({
    title: 'Business portfolio saved',
    message: 'Your business portfolio information has been updated.',
    position: 'topRight',
    layout: 2,
  });
};

const confirmDeletePortfolio = async () => {
  deletingPortfolio.value = true;
  const { ok, error } = await deletePortfolio(props.companyId);
  deletingPortfolio.value = false;
  if (!ok) {
    toast.error({ title: 'Could not delete portfolio', message: error, position: 'topRight', layout: 2 });
    return;
  }
  portfolioSaved.value = false;
  editingPortfolio.value = false;
  Object.assign(portfolioForm, { business_description: '', date_established: '', branches: 1 });
  products.value = [];
  orders.value = [];
  toast.success({
    title: 'Portfolio deleted',
    message: 'The business portfolio has been removed.',
    position: 'topRight',
    layout: 2,
  });
};

// ── Products ──────────────────────────────────────────────────────────────────
const products = ref([]);
const productModalRef = ref(null);
const editingProduct = ref(null);
const savingProduct = ref(false);
const deletingProduct = ref(null);
const productServerError = ref('');
const blankProduct = () => ({ product_name: '', description: '' });
const productForm = reactive(blankProduct());
const productErrors = reactive({ product_name: '', description: '' });

const clearProductErrors = () => Object.keys(productErrors).forEach((k) => (productErrors[k] = ''));

const validateProduct = () => {
  clearProductErrors();
  let valid = true;
  if (!productForm.product_name.trim()) { productErrors.product_name = 'Product name is required'; valid = false; }
  if (!productForm.description.trim()) { productErrors.description = 'Description is required'; valid = false; }
  return valid;
};

const openProductModal = (product = null) => {
  productServerError.value = '';
  clearProductErrors();
  editingProduct.value = product;
  if (product) {
    Object.assign(productForm, { product_name: product.product_name, description: product.description });
  } else {
    Object.assign(productForm, blankProduct());
  }
  productModalRef.value?.showModal();
};

const closeProductModal = () => productModalRef.value?.close();

const submitProduct = async () => {
  if (!validateProduct()) return;
  savingProduct.value = true;
  productServerError.value = '';
  const payload = { ...productForm };
  const { ok, error } = editingProduct.value
    ? await updateProduct(props.companyId, editingProduct.value.id, payload)
    : await addProduct(props.companyId, payload);
  savingProduct.value = false;
  if (!ok) { productServerError.value = error; return; }
  toast.success({
    title: editingProduct.value ? 'Product updated' : 'Product added',
    message: 'The product or service has been saved to your portfolio.',
    position: 'topRight',
    layout: 2,
  });
  closeProductModal();
  await reloadPortfolio();
};

const deleteProduct = async (id) => {
  deletingProduct.value = id;
  const { ok, error } = await removeProduct(props.companyId, id);
  deletingProduct.value = null;
  if (!ok) {
    toast.error({ title: 'Could not remove product', message: error, position: 'topRight', layout: 2 });
    return;
  }
  products.value = products.value.filter((p) => p.id !== id);
};

// ── Orders ────────────────────────────────────────────────────────────────────
const orders = ref([]);
const orderModalRef = ref(null);
const editingOrder = ref(null);
const savingOrder = ref(false);
const deletingOrder = ref(null);
const orderServerError = ref('');
const blankOrder = () => ({ order_description: '', currency_id: null, value: '', year: currentYear });
const orderForm = reactive(blankOrder());
const orderErrors = reactive({ order_description: '', currency_id: '', value: '', year: '' });

const clearOrderErrors = () => Object.keys(orderErrors).forEach((k) => (orderErrors[k] = ''));

const validateOrder = () => {
  clearOrderErrors();
  let valid = true;
  if (!orderForm.order_description.trim()) { orderErrors.order_description = 'Order description is required'; valid = false; }
  if (!orderForm.currency_id) { orderErrors.currency_id = 'Currency is required'; valid = false; }
  if (orderForm.value === '' || Number(orderForm.value) < 0) { orderErrors.value = 'Value must be 0 or greater'; valid = false; }
  if (!orderForm.year || Number(orderForm.year) < 1900 || Number(orderForm.year) > currentYear) {
    orderErrors.year = `Year must be between 1900 and ${currentYear}`;
    valid = false;
  }
  return valid;
};

const totalOrderValue = computed(() =>
  orders.value.reduce((sum, o) => sum + Number(o.value ?? 0), 0)
);

const formatMoney = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const openOrderModal = (order = null) => {
  orderServerError.value = '';
  clearOrderErrors();
  editingOrder.value = order;
  if (order) {
    Object.assign(orderForm, {
      order_description: order.order_description,
      currency_id: order.currency_id,
      value: order.value,
      year: order.year,
    });
  } else {
    Object.assign(orderForm, blankOrder());
  }
  orderModalRef.value?.showModal();
};

const closeOrderModal = () => orderModalRef.value?.close();

const submitOrder = async () => {
  if (!validateOrder()) return;
  savingOrder.value = true;
  orderServerError.value = '';
  const payload = { ...orderForm };
  const { ok, error } = editingOrder.value
    ? await updateOrder(props.companyId, editingOrder.value.id, payload)
    : await addOrder(props.companyId, payload);
  savingOrder.value = false;
  if (!ok) { orderServerError.value = error; return; }
  toast.success({
    title: editingOrder.value ? 'Order updated' : 'Order added',
    message: 'The previous order has been saved to your portfolio.',
    position: 'topRight',
    layout: 2,
  });
  closeOrderModal();
  await reloadPortfolio();
};

const deleteOrder = async (id) => {
  deletingOrder.value = id;
  const { ok, error } = await removeOrder(props.companyId, id);
  deletingOrder.value = null;
  if (!ok) {
    toast.error({ title: 'Could not remove order', message: error, position: 'topRight', layout: 2 });
    return;
  }
  orders.value = orders.value.filter((o) => o.id !== id);
};

// ── Load ──────────────────────────────────────────────────────────────────────
const reloadPortfolio = async () => {
  const { ok, data } = await getPortfolio(props.companyId);
  if (!ok) return;
  products.value = data?.data?.products ?? [];
  orders.value = data?.data?.orders ?? [];
};

const loadCurrencies = async () => {
  const { data } = await getActiveCurrencies();
  currencies.value = data?.data ?? [];
};

const load = async () => {
  if (!props.companyId) return;
  loading.value = true;
  const { ok, data } = await getPortfolio(props.companyId);
  loading.value = false;
  if (!ok) return;
  const portfolio = data?.data;
  if (portfolio) {
    portfolioSaved.value = true;
    editingPortfolio.value = false;
    Object.assign(portfolioForm, {
      business_description: portfolio.business_description ?? '',
      date_established: portfolio.date_established ? portfolio.date_established.substring(0, 10) : '',
      branches: portfolio.branches ?? 1,
    });
    products.value = portfolio.products ?? [];
    orders.value = portfolio.orders ?? [];
  }
};

onMounted(loadCurrencies);

const isStepComplete = computed(() => portfolioSaved.value && products.value.length > 0);

defineExpose({ load, isStepComplete });
</script>
