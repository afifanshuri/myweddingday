/** A package price: whole ringgit without cents (RM 1,800), otherwise always two decimals (RM 25.50). */
export const formatPrice = (value: number) => new Intl.NumberFormat("en-MY", {
  style: "currency", currency: "MYR", minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
}).format(value);
