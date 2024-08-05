import { FieldError, Price, ProductCode, PromotionCode } from './CommonSimpleTypes';
import { CheckProductCodeExists, CheckAddressExists, CheckedAddress, AddressValidationError, GetProductPrice, TryGetProductPrice, GetPricingFunction, CalculateShippingCost, CreateOrderAcknowledgmentLetter, PricedOrder, HtmlString, PricedOrderWithShippingMethod, SendOrderAcknowledgment, OrderAcknowledgement } from './PlaceOrderInternalTypes';
import { PlaceOrderError, PlaceOrderEvent, UnvalidatedAddress } from './PlaceOrderPublicTypes';
import { Either, Just, Right, Nothing } from 'purify-ts';
import { getPricingFunction } from './PlaceOrderPricing';
import { calculateShippingCost, placeOrder } from './PlaceOrderImplementation';
import { List } from 'immutable';
import { PlaceOrderEventDtoMapping, PlaceOrderErrorDtoMapping, OrderFormDtoMapping } from './PlaceOrderDto';
import { OrderFormDto, orderFormDtoSchema } from '../core/DtoTypes';
import { validateAll } from './utilities';

export type HttpRequest = {
    action: string,
    uri: string,
    body: string
}

export type HttpResponse = {
    httpStatusCode: number,
    body: string
}

export type PlaceOrderApi = (request: HttpRequest) => Promise<HttpResponse>;

const checkProductExists: CheckProductCodeExists = (productCode: ProductCode) => true;

const checkAddressExists: CheckAddressExists = async (unvalidatedAddress: UnvalidatedAddress) => {
    return new Promise<Either<AddressValidationError, CheckedAddress>>((resolve) => {
        resolve(Right(new CheckedAddress(
            unvalidatedAddress.addressLine1,
            unvalidatedAddress.addressLine2,
            unvalidatedAddress.addressLine3,
            unvalidatedAddress.addressLine4,
            unvalidatedAddress.city,
            unvalidatedAddress.zipCode,
            unvalidatedAddress.state,
            unvalidatedAddress.country
        )) as Either<AddressValidationError, CheckedAddress>);
    });
}

const getStandardPrices = (): GetProductPrice => 
    (productCode: ProductCode) => Price.unsafeCreate(10);

const getPromotionPrices = (promotionCode: PromotionCode): TryGetProductPrice => {
    const halfPricePromotion: TryGetProductPrice = (productCode: ProductCode) => 
        productCode.d === "ONSALE" ? Just(Price.unsafeCreate(5)) : Nothing;

    const quarterPricePromotion: TryGetProductPrice = (productCode: ProductCode) => 
        productCode.d === "ONSALE" ? Just(Price.unsafeCreate(2.5)) : Nothing;

    const noPromotion: TryGetProductPrice = (productCode: ProductCode) => Nothing;

    switch (promotionCode.d) {
        case "HALF":
            return halfPricePromotion;
        case "QUARTER":
            return quarterPricePromotion;
        default:
            return noPromotion;
    }
}

const getPricingFunctionImpl = (): GetPricingFunction => 
    getPricingFunction(getStandardPrices, getPromotionPrices);

const calculateShippingCostImpl: CalculateShippingCost = 
    (pricedOrder: PricedOrder) => calculateShippingCost(pricedOrder);

const createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter = 
    (pricedOrder: PricedOrderWithShippingMethod) => new HtmlString("some text");

const sendOrderAcknowledgment: SendOrderAcknowledgment = 
    (orderAcknowledgement: OrderAcknowledgement) => "sent";

const workflowResultToHttpResponse = (result: Either<PlaceOrderError, List<PlaceOrderEvent>>) =>
    result.caseOf({         
        Right: events => {
            const dtos = events.map(x => PlaceOrderEventDtoMapping.fromDomain(x)).toArray();
            const response: HttpResponse = {
                httpStatusCode: 200,
                body: JSON.stringify(dtos)
            };
            return response;            
        },
        Left: err => {
            const dto = PlaceOrderErrorDtoMapping.fromDomain(err);
            const response: HttpResponse = {
                httpStatusCode: 401,
                body: JSON.stringify(dto)
            };
            return response;
        }
    });

export const placeOrderApi: PlaceOrderApi = async (request: HttpRequest) => {    
    const orderFormJson = request.body;
    const validateJsonResults = validateAll(orderFormJson, orderFormDtoSchema);
    if (validateJsonResults.isLeft()) {
        const errorResult: HttpResponse = {
            httpStatusCode: 401,
            body: validateJsonResults.leftOrDefault(List<FieldError>()).map(x => x.errorMessage()).toArray().join(", ")
        };
        return errorResult;        
    }
    const orderForm: OrderFormDto = JSON.parse(orderFormJson);    
    const unvalidatedOrder = OrderFormDtoMapping.toUnvalidatedOrder(orderForm);

    const workflow = placeOrder(
        checkProductExists,
        checkAddressExists,
        getPricingFunctionImpl(),
        calculateShippingCostImpl,
        createOrderAcknowledgmentLetter,
        sendOrderAcknowledgment);
    const result = await workflow(unvalidatedOrder);
    return workflowResultToHttpResponse(result);
}