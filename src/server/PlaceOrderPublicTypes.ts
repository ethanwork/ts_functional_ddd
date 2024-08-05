import { List } from "immutable";
import { Either } from "purify-ts";
import { Address } from "./CommonCompoundTypes";
import { BillingAmount, EmailAddress, OrderId, OrderQuantity, PdfAttachment, ProductCode, BaseError } from './CommonSimpleTypes';
import { PricedOrder } from "./PlaceOrderInternalTypes";

export class UnvalidatedCustomerInfo {
    kind: "unvalidatedCustomerInfo" = "unvalidatedCustomerInfo";
	readonly firstName: string;
    readonly lastName: string;
    readonly emailAddress: string;
    readonly vipStatus: string;

    public constructor(firstName: string, lastName: string, emailAddress: string, vipStatus: string) {
		this.firstName = firstName;
        this.lastName = lastName;
        this.emailAddress = emailAddress;
        this.vipStatus = vipStatus;
    }
}

export class UnvalidatedAddress {
    kind: "unvalidatedAddress" = "unvalidatedAddress";
	readonly addressLine1: string;
    readonly addressLine2: string | undefined;
    readonly addressLine3: string | undefined;
    readonly addressLine4: string | undefined;
    readonly city: string;
    readonly zipCode: string;
    readonly state: string;
    readonly country: string;

    public constructor(addressLine1: string, addressLine2: string | undefined, addressLine3: string | undefined, addressLine4: string | undefined, city: string, zipCode: string, state: string, country: string) {
		this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.addressLine3 = addressLine3;
        this.addressLine4 = addressLine4;
        this.city = city;
        this.zipCode = zipCode;
        this.state = state;
        this.country = country;
    }
}

export class UnvalidatedOrderLine {
    kind: "unvalidatedOrderLine" = "unvalidatedOrderLine";
	readonly orderLineId: string;
    readonly productCode: string;
    readonly quantity: number;

    public constructor(orderLineId: string, productCode: string, quantity: number) {
		this.orderLineId = orderLineId;
        this.productCode = productCode;
        this.quantity = quantity;
    }
}

export class UnvalidatedOrder {
    kind: "unvalidatedOrder" = "unvalidatedOrder";
	readonly orderId: string;
    readonly customerInfo: UnvalidatedCustomerInfo;
    readonly shippingAddress: UnvalidatedAddress;
    readonly billingAddress: UnvalidatedAddress;
    readonly lines: List<UnvalidatedOrderLine>;
    readonly promotionCode: string;

    public constructor(orderId: string, customerInfo: UnvalidatedCustomerInfo, shippingAddress: UnvalidatedAddress, billingAddress: UnvalidatedAddress, lines: List<UnvalidatedOrderLine>, promotionCode: string) {
		this.orderId = orderId;
        this.customerInfo = customerInfo;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.lines = lines;
        this.promotionCode = promotionCode;
    }
}

export class OrderAcknowledgementSent {
    kind: "orderAcknowledgementSent" = "orderAcknowledgementSent";
	readonly orderId: OrderId;
    readonly emailAddress: EmailAddress;

    public constructor(orderId: OrderId, emailAddress: EmailAddress) {
		this.orderId = orderId;
        this.emailAddress = emailAddress;
    }
}

export type OrderPlaced = PricedOrder;

export class ShippableOrderLine {
    kind: "shippableOrderLine" = "shippableOrderLine";
	readonly productCode: ProductCode;
    readonly quantity: OrderQuantity;

    public constructor(productCode: ProductCode, quantity: OrderQuantity) {
		this.productCode = productCode;
        this.quantity = quantity;
    }
}

export class ShippableOrderPlaced {
    kind: "shippableOrderPlaced" = "shippableOrderPlaced";
	readonly orderId: OrderId;
    readonly shippingAddress: Address;
    readonly shipmentLines: List<ShippableOrderLine>;
    readonly pdf: PdfAttachment;

    public constructor(orderId: OrderId, shippingAddress: Address, shipmentLines: List<ShippableOrderLine>, pdf: PdfAttachment) {
		this.orderId = orderId;
        this.shippingAddress = shippingAddress;
        this.shipmentLines = shipmentLines;
        this.pdf = pdf;
    }
}

export class BillableOrderPlaced {
    kind: "billableOrderPlaced" = "billableOrderPlaced";
	readonly orderId: OrderId;
    readonly billingAddress: Address;
    readonly amountToBill: BillingAmount;

    public constructor(orderId: OrderId, billingAddress: Address, amountToBill: BillingAmount) {
		this.orderId = orderId;
        this.billingAddress = billingAddress;
        this.amountToBill = amountToBill;
    }
}

export type PlaceOrderEvent = 
    ShippableOrderPlaced | 
    BillableOrderPlaced |
    OrderAcknowledgementSent;

export class ValidationError implements BaseError {
    kind: "validationError" = "validationError";
    readonly message: string;

    public constructor(message: string) {
        this.message = message;
    }

    errorMessage() {
        return this.message;
    }
}

export class PricingError implements BaseError {
    kind: "pricingError" = "pricingError";
    readonly message: string;

    public constructor(message: string) {
        this.message = message;
    }

    errorMessage() {
        return this.message;
    }
}

export class ServiceInfo {
    kind: "serviceInfo" = "serviceInfo";
	readonly name: string;
    readonly endPoint: string;

    public constructor(name: string, endPoint: string) {
		this.name = name;
        this.endPoint = endPoint;
    }
}

export class RemoteServiceError implements BaseError {
    kind: "remoteServiceError" = "remoteServiceError";
	readonly service: ServiceInfo;
    readonly exception: Error;

    public constructor(service: ServiceInfo, exception: Error) {
		this.service = service;
        this.exception = exception;
    }

    errorMessage() {
        return this.exception.message;
    }
}

export type PlaceOrderError =
    ValidationError |
    PricingError |
    RemoteServiceError;

export type PlaceOrder = 
    (unvalidatedOrder: UnvalidatedOrder) => 
        Promise<Either<PlaceOrderError, List<PlaceOrderEvent>>>;
