import * as yup from "yup";

export const customerInfoDtoSchema = yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    emailAddress: yup.string().email().required(),
    vipStatus: yup.string().required()
});
export type CustomerInfoDto = yup.InferType<typeof customerInfoDtoSchema>;

export const addressDtoSchema = yup.object({
    addressLine1: yup.string().required(),
    addressLine2: yup.string(),
    addressLine3: yup.string(),
    addressLine4: yup.string(),
    city: yup.string().required(),
    zipCode: yup.string().required(),
    state: yup.string().required(),
    country: yup.string().required()
});
export type AddressDto = yup.InferType<typeof addressDtoSchema>;

export const orderLineDtoSchema = yup.object({
    orderLineId: yup.string().required(),
    productCode: yup.string().required(),
    quantity: yup.number().required()
});
export type OrderLineDto = yup.InferType<typeof orderLineDtoSchema>;

export const pricedOrderLineDtoSchema = yup.object({
    orderLineId: yup.string().required(),
    productCode: yup.string().required(),
    quantity: yup.number().required(),
    linePrice: yup.number().required(),
    comment: yup.string().required()
});
export type PricedOrderLineDto = yup.InferType<typeof pricedOrderLineDtoSchema>;

export const orderFormDtoSchema = yup.object({
    orderId: yup.string().required(),
    customerInfo: customerInfoDtoSchema.required(),
    shippingAddress: addressDtoSchema.required(),
    billingAddress: addressDtoSchema.required(),
    lines: yup.array(orderLineDtoSchema).required(),
    promotionCode: yup.string()
});
export type OrderFormDto = yup.InferType<typeof orderFormDtoSchema>;

export const shippableOrderLineDtoSchema = yup.object({
    productCode: yup.string().required(),
    quantity: yup.number().required()
});
export type ShippableOrderLineDto = yup.InferType<typeof shippableOrderLineDtoSchema>;

export const pdfDtoSchema = yup.object({
    name: yup.string().required(),
    bytes: yup.mixed().required()
});
export type PdfDto = yup.InferType<typeof pdfDtoSchema>;

export const shippableOrderPlacedDtoSchema = yup.object({
    orderId: yup.string().required(),
    shippingAddress: addressDtoSchema.required(),
    shipmentLines: yup.array(shippableOrderLineDtoSchema).required(),
    pdf: pdfDtoSchema.required()
});
export type ShippableOrderPlacedDto = yup.InferType<typeof shippableOrderPlacedDtoSchema>;


export const billableOrderPlacedDtoSchema = yup.object({
    orderId: yup.string().required(),
    billingAddress: addressDtoSchema.required(),
    amountToBill: yup.number().required()
});
export type BillableOrderPlacedDto = yup.InferType<typeof billableOrderPlacedDtoSchema>;

export const orderAcknowledgmentSentDtoSchema = yup.object({
    orderId: yup.string().required(),
    emailAddress: yup.string().email().required()
});
export type OrderAcknowledgmentSentDto = yup.InferType<typeof orderAcknowledgmentSentDtoSchema>;

export type PlaceOrderEventDto = { [key: string]: any };

export const placeOrderErrorDtoSchema = yup.object({
    code: yup.string().required(),
    message: yup.string().required()
});
export type PlaceOrderErrorDto = yup.InferType<typeof placeOrderErrorDtoSchema>;
