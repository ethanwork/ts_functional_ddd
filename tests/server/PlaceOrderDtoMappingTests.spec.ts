import { AddressDto, CustomerInfoDto, OrderLineDto, PricedOrderLineDto, OrderFormDto } from '../../src/core/DtoTypes';
import { UnvalidatedAddress } from '../../src/server/PlaceOrderPublicTypes';
import { Address } from '../../src/server/CommonCompoundTypes';
import { String50, ZipCode, UsStateCode } from '../../src/server/CommonSimpleTypes';
import { AddressDtoMapping } from '../../src/server/PlaceOrderDto';

const toJson = (value: any): any => {
    return JSON.stringify(value);
}

const getCustomerInfoDto = (): CustomerInfoDto => {
    return {
        firstName: "firstname",
        lastName: "lastname",
        emailAddress: "email@test.com",
        vipStatus: "normal"
    };
}

const getAddressDto = (): AddressDto => {
    return {
        addressLine1: "addressline1",
        addressLine2: undefined,
        addressLine3: "",
        addressLine4: "addressline4",
        city: "city",
        zipCode: "98503",
        state: "WA",
        country: "USA"        
    }
}

const getOrderLineDto = (): OrderLineDto => {
    return {
        orderLineId: "123",
        productCode: "W1234",
        quantity: 5
    };
}

const getPricedOrderLineDto = (): PricedOrderLineDto => {
    return {
        orderLineId: "123",
        productCode: "W1234",
        quantity: 5,
        linePrice: 10.50,
        comment: "comment"
    };
}

const getOrderFormDto = (): OrderFormDto => {
    return {
        orderId: "1234",
        customerInfo: getCustomerInfoDto(),
        shippingAddress: getAddressDto(),
        billingAddress: getAddressDto(),
        lines: [getOrderLineDto(), getOrderLineDto()],
        promotionCode: "promotioncode"
    };
}

const getUnvalidatedAddress = (): UnvalidatedAddress => {
    const dto = getAddressDto();
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

const getAddress = (): Address => {
    const ua = getUnvalidatedAddress();
    return new Address(
        String50.create(ua.addressLine1).unsafeCoerce(),
        String50.createOption(ua.addressLine2).unsafeCoerce(),
        String50.createOption(ua.addressLine3).unsafeCoerce(),
        String50.createOption(ua.addressLine4).unsafeCoerce(),
        String50.create(ua.city).unsafeCoerce(),
        ZipCode.create(ua.zipCode).unsafeCoerce(),
        UsStateCode.create(ua.state).unsafeCoerce(),
        String50.create(ua.country).unsafeCoerce()
    );
}

describe("AddressDto toAddress ", () => {
    test('is valid', () => {
        let dto = getAddressDto();
        let a = getAddress();
        expect(toJson(AddressDtoMapping.toAddress(dto))).toEqual(toJson(a));
    });
    
    test('is invalid zipCode', () => {
        let dto = getAddressDto();
        dto.zipCode = "abc";
        expect(AddressDtoMapping.toAddress(dto).isRight()).toBe(false);
    });
    
    test('is invalid state', () => {
        let dto = getAddressDto();
        dto.state = "yz";
        expect(AddressDtoMapping.toAddress(dto).isRight()).toBe(false);
    });
});

describe("AddressDto toUnvalidatedAddress ", () => {
    test("is valid", () => {
        let dto = getAddressDto();
        let ua = getUnvalidatedAddress();
        expect(toJson(AddressDtoMapping.toUnvalidatedAddress(dto))).toEqual(toJson(ua));
    });
});

describe("AddressDto fromAddress ", () => {
    test("is valid", () => {
        let dto = getAddressDto();
        dto.addressLine2 = "";
        let a = getAddress();
        expect(toJson(AddressDtoMapping.fromAddress(a))).toEqual(toJson(dto));
    });
});



export {}