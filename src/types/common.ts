export const InvoiceType = { GTGT: '1', BAN_HANG: '2', PXK: '6' } as const
export type InvoiceTypeCode = typeof InvoiceType[keyof typeof InvoiceType]

export const AdjustmentType = { NEW: '1', REPLACE: '3', ADJUST: '5' } as const
export type AdjustmentTypeCode = typeof AdjustmentType[keyof typeof AdjustmentType]

export const AdjustmentInvoiceType = { MONEY: '1', INFO: '2' } as const
export type AdjustmentInvoiceTypeCode = typeof AdjustmentInvoiceType[keyof typeof AdjustmentInvoiceType]

export const MetaValueType = { TEXT: 'text', NUMBER: 'number', DATE: 'date' } as const
export type MetaValueTypeCode = typeof MetaValueType[keyof typeof MetaValueType]

export const PaymentMethod = { CASH: 'CASH', TM_CK: 'TM/CK', CK: 'CK' } as const
export const Currency = { VND: 'VND', USD: 'USD' } as const
