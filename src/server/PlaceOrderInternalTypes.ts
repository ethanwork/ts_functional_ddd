import { List } from "immutable";
import { Either, Maybe } from "purify-ts";
import { ValidationError } from "yup";
import { CustomerInfo, Address } from "./CommonCompoundTypes";
import { OrderId, BillingAmount, OrderLineId, Price, OrderQuantity, ProductCode, PromotionCode, EmailAddress } from './CommonSimpleTypes';
import { OrderAcknowledgementSent, PlaceOrderEvent, PricingError, UnvalidatedAddress, UnvalidatedOrder } from './PlaceOrderPublicTypes';

// ======================================================
// Define each step in the PlaceOrder workflow using internal types 
// (not exposed outside the bounded context)
// ======================================================

// ---------------------------
// Validation step
// ---------------------------

// Product validation
export type CheckProductCodeExists = 
    (productCode: ProductCode) => boolean;

// Address validation
export type AddressValidationError = "invalidFormat" | "addressNotFound";

export class CheckedAddress extends UnvalidatedAddress {}

export type CheckAddressExists = 
    (unvalidatedAddress: UnvalidatedAddress) =>
        Promise<Either<AddressValidationError, CheckedAddress>>;

// ---------------------------
// Validated Order 
// ---------------------------

export class Standard { 
    kind: "standard" = "standard"; 
}
export type Promotion = PromotionCode;
export type PricingMethod = Standard | Promotion;

export class ValidatedOrderLine {
    kind: "validatedOrderLine" = "validatedOrderLine";
	readonly orderLineId: OrderLineId;
    readonly productCode: ProductCode;
    readonly quantity: OrderQuantity;

    public constructor(orderLineId: OrderLineId, productCode: ProductCode, quantity: OrderQuantity) {
		this.orderLineId = orderLineId;
        this.productCode = productCode;
        this.quantity = quantity;
    }
}

export class ValidatedOrder {
    kind: "validatedOrder" = "validatedOrder";
	readonly orderId: OrderId;
    readonly customerInfo: CustomerInfo;
    readonly shippingAddress: Address;
    readonly billingAddress: Address;
    readonly lines: List<ValidatedOrderLine>;
    readonly pricingMethod: PricingMethod;

    public constructor(orderId: OrderId, customerInfo: CustomerInfo, shippingAddress: Address, billingAddress: Address, lines: List<ValidatedOrderLine>, pricingMethod: PricingMethod) {
		this.orderId = orderId;
        this.customerInfo = customerInfo;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.lines = lines;
        this.pricingMethod = pricingMethod;
    }
}

export type ValidateOrder = (
    checkProductCodeExists: CheckProductCodeExists,
    checkAddressExists: CheckAddressExists,
    unvalidatedOrder: UnvalidatedOrder) => 
        Promise<Either<ValidationError, ValidatedOrder>>;

// ---------------------------
// Pricing step
// ---------------------------

export type GetProductPrice = (productCode: ProductCode) => Price;

export type TryGetProductPrice = 
    (productCode: ProductCode) => Maybe<Price>;

export type GetPricingFunction = 
    (pricingMethod: PricingMethod) => GetProductPrice;

export type GetStandardPrices = 
    () => GetProductPrice;

export type GetPromotionPrices = 
    (promotionCode: PromotionCode) => TryGetProductPrice;

export class PricedOrderProductLine {
    kind: "pricedOrderProductLine" = "pricedOrderProductLine";
	readonly orderLineId: OrderLineId;
    readonly productCode: ProductCode;
    readonly quantity: OrderQuantity;
    readonly linePrice: Price;

    public constructor(orderLineId: OrderLineId, productCode: ProductCode, quantity: OrderQuantity, linePrice: Price) {
		this.orderLineId = orderLineId;
        this.productCode = productCode;
        this.quantity = quantity;
        this.linePrice = linePrice;
    }
}

export class CommentLine {
    kind: "commentLine" = "commentLine";
    readonly d: string;

    public constructor(d: string) {
        this.d = d;
    }
}

export type PricedOrderLine = PricedOrderProductLine | CommentLine;

export class PricedOrder {
    kind: "pricedOrder" = "pricedOrder";
	readonly orderId: OrderId;
    readonly customerInfo: CustomerInfo;
    readonly shippingAddress: Address;
    readonly billingAddress: Address;
    readonly amountToBill: BillingAmount;
    readonly lines: List<PricedOrderLine>;
    readonly pricingMethod: PricingMethod;

    public constructor(orderId: OrderId, customerInfo: CustomerInfo, shippingAddress: Address, billingAddress: Address, amountToBill: BillingAmount, lines: List<PricedOrderLine>, pricingMethod: PricingMethod) {
		this.orderId = orderId;
        this.customerInfo = customerInfo;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.amountToBill = amountToBill;
        this.lines = lines;
        this.pricingMethod = pricingMethod;
    }
}

export type PriceOrder = (
    getPricingFunction: GetPricingFunction,
    validatedOrder: ValidatedOrder) =>
        Either<PricingError, PricedOrder>;

// ---------------------------
// Shipping
// ---------------------------

export type ShippingMethod = 
    "postalService" |
    "fedex24" |
    "fedex48" |
    "ups48";

export class ShippingInfo {
    kind: "shippingInfo" = "shippingInfo";
	readonly shippingMethod: ShippingMethod;
    readonly shippingCost: Price;

    public constructor(shippingMethod: ShippingMethod, shippingCost: Price) {
		this.shippingMethod = shippingMethod;
        this.shippingCost = shippingCost;
    }
}

export class PricedOrderWithShippingMethod {
    kind: "pricedOrderWithShippingMethod" = "pricedOrderWithShippingMethod";
	readonly shippingInfo: ShippingInfo;
    readonly pricedOrder: PricedOrder;

    public constructor(shippingInfo: ShippingInfo, pricedOrder: PricedOrder) {
		this.shippingInfo = shippingInfo;
        this.pricedOrder = pricedOrder;
    }
}

export type CalculateShippingCost = 
    (pricedOrder: PricedOrder) => Price;

export type AddShippingInfoToOrder = (
    calculateShippingCost: CalculateShippingCost,
    pricedOrder: PricedOrder) => 
        PricedOrderWithShippingMethod;

// ---------------------------
// VIP shipping
// ---------------------------

export type FreeVipShipping =
    (pricedOrderWithShippingMethod: PricedOrderWithShippingMethod) =>
        PricedOrderWithShippingMethod;

// ---------------------------
// Send OrderAcknowledgment 
// ---------------------------

// todo: check if switching from 'type' to 'kind' needs any updates
export class HtmlString {
    kind: "htmlString" = "htmlString";
    readonly d: string;

    public constructor(d: string) {
        this.d = d;
    }
}

export class OrderAcknowledgement {
    kind: "orderAcknowledgement" = "orderAcknowledgement";
	readonly emailAddress: EmailAddress;
    readonly letter: HtmlString;

    public constructor(emailAddress: EmailAddress, letter: HtmlString) {
		this.emailAddress = emailAddress;
        this.letter = letter;
    }
}

export type CreateOrderAcknowledgmentLetter =
    (pricedOrderWithShippingMethod: PricedOrderWithShippingMethod) =>
        HtmlString;

/// Send the order acknowledgement to the customer
/// Note that this does NOT generate an Result-type error (at least not in this workflow)
/// because on failure we will continue anyway.
/// On success, we will generate a OrderAcknowledgmentSent event,
/// but on failure we won't.

export type SendResult = "sent" | "notSent";

export type SendOrderAcknowledgment =
    (orderAcknowledgement: OrderAcknowledgement) => SendResult;

export type AcknowledgeOrder = (
    createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter,
    sendOrderAcknowledgment: SendOrderAcknowledgment,
    pricedOrderWithShippingMethod: PricedOrderWithShippingMethod) =>
        Maybe<OrderAcknowledgementSent>;

// ---------------------------
// Create events
// ---------------------------

export type CreateEvents = (
    pricedOrder: PricedOrder,
    orderAcknowledgementSent: Maybe<OrderAcknowledgementSent>) =>
        List<PlaceOrderEvent>;