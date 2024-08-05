import { List } from "immutable";
import { Either, Just, Left, Maybe, Nothing, Right } from "purify-ts";
import { exhaustiveCheck, isNullOrWhiteSpace } from './utilities';

export interface BaseError {
    errorMessage(): string;
}

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

export class FieldError implements BaseError {
    kind: "fieldError" = "fieldError";
    readonly message: string;
    readonly field: string;

    public constructor(message: string, field: string) {
        this.message = message;
        this.field = field;
    }

    errorMessage() {
        return `${this.field}: ${this.message}`;
    }
}



export class String50 {
    kind: "string50" = "string50";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, String50> {
        // string must be less than 50 characters and have a value
        return d && d.length > 0 && d.length <= 50
            ? Right(new String50(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "String50")));
    }

    public static createOption(d?: string, fieldName?: string): Either<ValidationError, Maybe<String50>> {
        // if no value, then return it as a valid 'Nothing'
        if (!d) {
            return Right(Nothing);
        }
        // if there is a value, validate it is a valid value. If so return a wrapped
        // Maybe of that String50, and if it is an invalid value return the error
        return d && d.length > 0 && d.length <= 50
            ? Right(Just(new String50(d)))
            : Left(new ValidationError("Invalid " + (fieldName ?? "String50")));
    }
}

export class EmailAddress {
    kind: "emailAddress" = "emailAddress";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, EmailAddress> {
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(d)
            ? Right(new EmailAddress(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "EmailAddress")));
    }
}

// todo: test if this kind of DU works or needs to be made like the class DU's
// with assigning kind to itself a second time to prevent an 'undefined' kind property
export type VipStatus = 
    | { kind: "normal", d: "normal" }
    | { kind: "vip", d: "vip" };
export const vipStatusCreate = (vipStatus: string): Either<ValidationError, VipStatus> => {
    const vipStatusCast = { kind: vipStatus } as VipStatus;
    let isValid = false;
    switch(vipStatusCast.kind) {
        case "normal":
        case "vip":
            isValid = true;
            break;
        default:
            exhaustiveCheck(vipStatusCast);
    }
    return isValid ? Right(vipStatusCast) : Left(new ValidationError("Invalid VipStatus"));
}

export class ZipCode {
    kind: "zipCode" = "zipCode";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, ZipCode> {
        return /^\d{5}$/.test(d)
            ? Right(new ZipCode(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "ZipCode")));
    }
}

export class UsStateCode {
    kind: "usStateCode" = "usStateCode";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, UsStateCode> {
        const re = /^(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$/;
        return re.test(d)
            ? Right(new UsStateCode(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "UsStateCode")));
    }
}

export class OrderId {
    kind: "orderId" = "orderId";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, OrderId> {
        return d && d.trim().length > 0 && d.trim().length < 10
            ? Right(new OrderId(d.trim()))
            : Left(new ValidationError("Invalid " + (fieldName ?? "OrderId")));
    }
}

export class OrderLineId {
    kind: "orderLineId" = "orderLineId";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, OrderLineId> {
        return d && d.trim().length > 0 && d.trim().length < 10
            ? Right(new OrderLineId(d.trim()))
            : Left(new ValidationError("Invalid " + (fieldName ?? "OrderLineId")));
    }
}

export class WidgetCode {
    kind: "widgetCode" = "widgetCode";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, WidgetCode> {
        return /^W\d{4}$/.test(d)
            ? Right(new WidgetCode(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "WidgetCode")));
    }
}

export class GizmoCode {
    kind: "gizmoCode" = "gizmoCode";
    readonly d: string;

    private constructor(d: string) {
        this.d = d;
    }
    
    public static create(d: string, fieldName?: string): Either<ValidationError, GizmoCode> {
        return /^G\d{3}$/.test(d)
            ? Right(new GizmoCode(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "GizmoCode")));
    }
}

export type ProductCode = WidgetCode | GizmoCode;

export const productCodeCreate = (code: string, fieldName: string): Either<ValidationError, ProductCode> => {
    if (isNullOrWhiteSpace(code)) {
        return Left(new ValidationError(`${fieldName}: Must not be null or whitespace`));
    } else if (code.charAt(0) === "W") {
        return WidgetCode.create(code, fieldName);
    } else if (code.charAt(0) === "G") {
        return GizmoCode.create(code, fieldName);
    } else {
        return Left(new ValidationError(`${fieldName}: Format not recognized '${code}'`));
    }
}

export class UnitQuantity {
    kind: "unitQuantity" = "unitQuantity";
    readonly d: number;

    private constructor(d: number) {
        this.d = d;
    }
    
    public static create(d: number, fieldName?: string): Either<ValidationError, UnitQuantity> {
        return Number.isInteger(d) && d >= 1 && d <= 1000
            ? Right(new UnitQuantity(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "UnitQuantity")));
    }
}

export class KilogramQuantity {
    kind: "kilogramQuantity" = "kilogramQuantity";
    readonly d: number;

    private constructor(d: number) {
        this.d = d;
    }
    
    public static create(d: number, fieldName?: string): Either<ValidationError, KilogramQuantity> {
        return d >= 0.05 && d <= 100
            ? Right(new KilogramQuantity(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "KilogramQuantity")));
    }
}

export type OrderQuantity = UnitQuantity | KilogramQuantity;
export const orderQuantityCreate = 
    (productCode: ProductCode, quantity: number, fieldName: string): Either<ValidationError, OrderQuantity> => {
    switch (productCode.kind) {
        case "widgetCode":
            return UnitQuantity.create(quantity, fieldName);
        case "gizmoCode":
            return KilogramQuantity.create(quantity, fieldName);
        default:
            exhaustiveCheck(productCode);
    }
}

export class Price {
    kind: "price" = "price";
    readonly d: number;

    private constructor(d: number) {
        this.d = d;
    }
    
    public static create(d: number, fieldName?: string): Either<ValidationError, Price> {
        return d >= 0 && d <= 1000
            ? Right(new Price(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "Price")));
    }

    public static unsafeCreate(d: number, fieldName?: string) {
        return this.create(d, fieldName).unsafeCoerce();
    }
}

export class BillingAmount {
    kind: "billingAmount" = "billingAmount";
    readonly d: number;

    private constructor(d: number) {
        this.d = d;
    }
    
    public static create(d: number, fieldName?: string): Either<ValidationError, BillingAmount> {
        return d >= 0 && d <= 10000
            ? Right(new BillingAmount(d))
            : Left(new ValidationError("Invalid " + (fieldName ?? "BillingAmount")));
    }

    public static sumPrices = (prices: List<Price>) => {
        return this.create(prices.map(x => x.d).reduce((accum, curr) => accum + curr, 0)).unsafeCoerce();
    }
}

export class PdfAttachment {
    kind: "pdfAttachment" = "pdfAttachment";
	readonly name: string;
    readonly data: any;

    public constructor(name: string, data: any) {
		this.name = name;
        this.data = data;
    }
}

export class PromotionCode {
    kind: "promotionCode" = "promotionCode";
    readonly d: string;

    public constructor(d: string) {
        this.d = d;
    }
}