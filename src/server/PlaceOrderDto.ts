import { List } from 'immutable';
import { Either } from 'purify-ts';
import { AddressDto, CustomerInfoDto, OrderFormDto, OrderLineDto, PricedOrderLineDto, ShippableOrderLineDto, ShippableOrderPlacedDto, PdfDto, BillableOrderPlacedDto, OrderAcknowledgmentSentDto, PlaceOrderEventDto, PlaceOrderErrorDto } from '../core/DtoTypes';
import { Address, CustomerInfo, PersonalName } from './CommonCompoundTypes';
import { ValidationError, String50, ZipCode, UsStateCode, EmailAddress, vipStatusCreate, PdfAttachment } from './CommonSimpleTypes';
import { UnvalidatedAddress, UnvalidatedCustomerInfo, UnvalidatedOrderLine, UnvalidatedOrder, ShippableOrderLine, ShippableOrderPlaced, BillableOrderPlaced, OrderAcknowledgementSent, PlaceOrderEvent, PlaceOrderError } from './PlaceOrderPublicTypes';
import { combine, exhaustiveCheck } from './utilities';
import { PricedOrderLine } from './PlaceOrderInternalTypes';

export class CustomerInfoMapping {
    static toUnvalidatedCustomerInfo(dto: CustomerInfoDto): UnvalidatedCustomerInfo {
        return new UnvalidatedCustomerInfo(
            dto.firstName,
            dto.lastName,
            dto.emailAddress,
            dto.vipStatus
        );
    }

    static toCustomerInfo(dto: CustomerInfoDto): Either<List<ValidationError>, CustomerInfo> {
        const firstName = String50.create(dto.firstName);
        const lastName = String50.create(dto.lastName);
        const emailAddress = EmailAddress.create(dto.emailAddress);
        const vipStatus = vipStatusCreate(dto.vipStatus);

        return combine<ValidationError>().apply4(firstName, lastName, emailAddress, vipStatus).map(([fn, ln, email, vip]) =>
            new CustomerInfo(
                new PersonalName(fn, ln),
                email,
                vip
            ));
    }

    static fromCustomerInfo(domainObj: CustomerInfo): CustomerInfoDto {
        const dto: CustomerInfoDto = {
            firstName: domainObj.name.firstName.d,
            lastName: domainObj.name.lastName.d,
            emailAddress: domainObj.emailAddress.d,
            vipStatus: domainObj.vipStatus.d
        }
        return dto;
    }
}

export class AddressDtoMapping {
    static toUnvalidatedAddress(dto: AddressDto): UnvalidatedAddress {
        return new UnvalidatedAddress(
            dto.addressLine1,
            dto.addressLine2,
            dto.addressLine3,
            dto.addressLine4,
            dto.city,
            dto.zipCode,
            dto.state,
            dto.country);
    }

    static toAddress(dto: AddressDto): Either<List<ValidationError>, Address> {
        const addressLine1 = String50.create(dto.addressLine1, "addressLine1");
        const addressLine2 = String50.createOption(dto.addressLine2, "addressLine2");
        const addressLine3 = String50.createOption(dto.addressLine3, "addressLine3");
        const addressLine4 = String50.createOption(dto.addressLine4, "addressLine4");
        const city = String50.create(dto.city, "city");
        const zipCode = ZipCode.create(dto.zipCode, "zipCode");
        const state = UsStateCode.create(dto.state, "state");
        const country = String50.create(dto.country, "country");

        return combine<ValidationError>().apply8(addressLine1, addressLine2, addressLine3,
            addressLine4, city, zipCode, state, country).map(([a1, a2, a3, a4, city, zip, state, country]) => 
                new Address(a1, a2, a3, a4, city, zip, state, country));
    }

    static fromAddress(domainObj: Address): AddressDto {
        const dto: AddressDto = {
            addressLine1: domainObj.addressLine1.d,
            addressLine2: domainObj.addressLine2.map(x => x.d).orDefault(""),
            addressLine3: domainObj.addressLine3.map(x => x.d).orDefault(""),
            addressLine4: domainObj.addressLine4.map(x => x.d).orDefault(""),
            city: domainObj.city.d,
            zipCode: domainObj.zipCode.d,
            state: domainObj.state.d,
            country: domainObj.country.d
        };
        return dto;
    }
}

export class OrderLineDtoMapping {
    static toUnvalidatedOrderLine(dto: OrderLineDto): UnvalidatedOrderLine {
        return new UnvalidatedOrderLine(
            dto.orderLineId,
            dto.productCode,
            dto.quantity);
    }
}

export class PricedOrderLineDtoMapping {
    static fromDomain(domainObj: PricedOrderLine): PricedOrderLineDto {
        switch (domainObj.kind) {
            case "pricedOrderProductLine":
                return {
                    orderLineId: domainObj.orderLineId.d,
                    productCode: domainObj.productCode.d,
                    quantity: domainObj.quantity.d,
                    linePrice: domainObj.linePrice.d,
                    comment: ""                    
                };
            case "commentLine":
                return {
                    orderLineId: "",
                    productCode: "",
                    quantity: 0,
                    linePrice: 0,
                    comment: domainObj.d
                }
            default:
                exhaustiveCheck(domainObj);
        }
    }
}

export class OrderFormDtoMapping {
    static toUnvalidatedOrder(dto: OrderFormDto): UnvalidatedOrder {
        return new UnvalidatedOrder(
            dto.orderId,
            CustomerInfoMapping.toUnvalidatedCustomerInfo(dto.customerInfo),
            AddressDtoMapping.toUnvalidatedAddress(dto.shippingAddress),
            AddressDtoMapping.toUnvalidatedAddress(dto.billingAddress),
            List(dto.lines.map(x => OrderLineDtoMapping.toUnvalidatedOrderLine(x))),
            dto.promotionCode ?? "");
    }
}

export class PdfDtoMapping {
    static fromDomain(domainObj: PdfAttachment): PdfDto {
        return {
            name: domainObj.name,
            bytes: domainObj.data
        };
    }
}

export class ShippableOrderPlacedDtoMapping {
    static fromShippableOrderLine(domainObj: ShippableOrderLine): ShippableOrderLineDto {
        return {
            productCode: domainObj.productCode.d,
            quantity: domainObj.quantity.d
        };
    }

    static fromDomain(domainObj: ShippableOrderPlaced): ShippableOrderPlacedDto {
        return {
            orderId: domainObj.orderId.d,
            shippingAddress: AddressDtoMapping.fromAddress(domainObj.shippingAddress),
            shipmentLines: domainObj.shipmentLines.map(x => this.fromShippableOrderLine(x)).toArray(),
            pdf: PdfDtoMapping.fromDomain(domainObj.pdf)
        };
    }
}

export class BillableOrderPlacedDtoMapping {
    static fromDomain(domainObj: BillableOrderPlaced): BillableOrderPlacedDto {
        return {
            orderId: domainObj.orderId.d,
            billingAddress: AddressDtoMapping.fromAddress(domainObj.billingAddress),
            amountToBill: domainObj.amountToBill.d
        };
    }
}

export class OrderAcknowledgmentSentDtoMapping {
    static fromDomain(domainObj: OrderAcknowledgementSent): OrderAcknowledgmentSentDto {
        return {
            orderId: domainObj.orderId.d,
            emailAddress: domainObj.emailAddress.d
        };
    }
}

export class PlaceOrderEventDtoMapping {
    static fromDomain(domainObj: PlaceOrderEvent): PlaceOrderEventDto {
        let dict: any = {};
        let key = domainObj.kind;
        switch (domainObj.kind) {
            case "shippableOrderPlaced":                
                dict[key] = ShippableOrderPlacedDtoMapping.fromDomain(domainObj);
                return dict;
            case "billableOrderPlaced":
                dict[key] = BillableOrderPlacedDtoMapping.fromDomain(domainObj);
                return dict;
            case "orderAcknowledgementSent":
                dict[key] = OrderAcknowledgmentSentDtoMapping.fromDomain(domainObj);
                return dict;
            default:
                exhaustiveCheck(domainObj);
        }
    }
}

export class PlaceOrderErrorDtoMapping {
    static fromDomain(domainObj: PlaceOrderError): PlaceOrderErrorDto {
        switch (domainObj.kind) {
            case "validationError":
                return {
                    code: domainObj.kind,
                    message: domainObj.errorMessage()
                };
            case "pricingError":
                return {
                    code: domainObj.kind,
                    message: domainObj.errorMessage()
                };
            case "remoteServiceError":
                return {
                    code: domainObj.kind,
                    message: domainObj.errorMessage()
                }
            default:
                exhaustiveCheck(domainObj);
        }
    }
}