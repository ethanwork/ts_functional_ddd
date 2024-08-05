import { UnvalidatedCustomerInfo, UnvalidatedAddress, UnvalidatedOrderLine, UnvalidatedOrder, PricingError, OrderAcknowledgementSent, ShippableOrderLine, ShippableOrderPlaced, BillableOrderPlaced, PlaceOrderEvent, PlaceOrder, PlaceOrderError } from './PlaceOrderPublicTypes';
import { String50, EmailAddress, vipStatusCreate, ZipCode, UsStateCode, ValidationError, OrderId, OrderLineId, ProductCode, productCodeCreate, orderQuantityCreate, Price, BillingAmount, PdfAttachment } from './CommonSimpleTypes';
import { combine, exhaustiveCheck } from './utilities';
import { CustomerInfo, PersonalName, Address } from './CommonCompoundTypes';
import { CheckAddressExists, CheckProductCodeExists, ValidatedOrderLine, CheckedAddress, GetProductPrice, ValidatedOrder, PricedOrderProductLine, PricedOrderLine, PricingMethod, CommentLine, GetPricingFunction, PricedOrder, CalculateShippingCost, AddShippingInfoToOrder, ShippingInfo, PricedOrderWithShippingMethod, FreeVipShipping, AcknowledgeOrder, CreateOrderAcknowledgmentLetter, SendOrderAcknowledgment, OrderAcknowledgement, CreateEvents } from './PlaceOrderInternalTypes';
import { Either, Just, Left, Right, Nothing, Maybe } from 'purify-ts';
import { List } from 'immutable';
import { createPricingMethod } from './PlaceOrderPricing';

const toCustomerInfo = (unvalidatedCustomerInfo: UnvalidatedCustomerInfo) => {
    const firstName = String50.create(unvalidatedCustomerInfo.firstName, "firstName");
    const lastName = String50.create(unvalidatedCustomerInfo.lastName, "lastName");
    const emailAddress = EmailAddress.create(unvalidatedCustomerInfo.emailAddress, "emailAddress");
    const vipStatus = vipStatusCreate(unvalidatedCustomerInfo.vipStatus);

    return combine<ValidationError>().apply4(firstName, lastName, emailAddress, vipStatus).map(
        ([fn, ln, email, vip]) => new CustomerInfo(new PersonalName(fn, ln), email, vip));
}

const toAddress = (checkedAddress: CheckedAddress) => {
    const addressLine1 = String50.create(checkedAddress.addressLine1, "addressLine1");
    const addressLine2 = String50.createOption(checkedAddress.addressLine2, "addressLine2");
    const addressLine3 = String50.createOption(checkedAddress.addressLine3, "addressLine3");
    const addressLine4 = String50.createOption(checkedAddress.addressLine4, "addressLine4");
    const city = String50.create(checkedAddress.city, "city");
    const zipCode = ZipCode.create(checkedAddress.zipCode, "zipCode");
    const state = UsStateCode.create(checkedAddress.state, "state");
    const country = String50.create(checkedAddress.country, "country");

    return combine<ValidationError>().apply8(addressLine1, addressLine2, addressLine3, addressLine4,
        city, zipCode, state, country).map(([a1, a2, a3, a4, city, zip, state, country]) => 
            new Address(a1, a2, a3, a4, city, zip, state, country));
}

const toCheckedAddress = async (checkAddress: CheckAddressExists, unvalidatedAddress: UnvalidatedAddress) => {
    const result = await checkAddress(unvalidatedAddress);
    const mappedErrorResult = result.mapLeft(x => {
        switch (x) {
            case "addressNotFound":
                return new ValidationError("Address not found");
            case "invalidFormat":
                return new ValidationError("Address has bad format");
            default:
                exhaustiveCheck(x);
        }
    })
    return mappedErrorResult;
}

const toOrderId = (orderId: string) => {
    return OrderId.create(orderId, "orderId");
}

const toOrderLineId = (orderLineId: string) => {
    return OrderLineId.create(orderLineId, "orderLineId");
}

const toProductCode = (checkProductCodeExists: CheckProductCodeExists,
    productCode: string) => {
    const checkProduct = (productCode: ProductCode): Either<ValidationError, ProductCode> => {
        if (checkProductCodeExists(productCode)) {
            return Right(productCode);
        } else {
            return Left(new ValidationError("Invalid: " + productCode.d));
        }
    }
    return productCodeCreate(productCode, "productCode").chain(x => checkProduct(x));
}

const toOrderQuantity = (productCode: ProductCode, quantity: number) => {
    return orderQuantityCreate(productCode, quantity, "orderQuantity");
}

const toValidatedOrderLine = (checkProductCodeExists: CheckProductCodeExists,
    unvalidatedOrderLine: UnvalidatedOrderLine) => {
    const orderLineId = toOrderLineId(unvalidatedOrderLine.orderLineId);
    const productCode = toProductCode(checkProductCodeExists, unvalidatedOrderLine.productCode);
    const quantity = productCode.chain(x => toOrderQuantity(x, unvalidatedOrderLine.quantity));
    return combine<ValidationError>().apply3(orderLineId, productCode, quantity).map(([olid, pc, q]) => 
        new ValidatedOrderLine(olid, pc, q));
}

const validateOrder = async (checkProductCodeExists: CheckProductCodeExists,
    checkAddressExists: CheckAddressExists, unvalidatedOrder: UnvalidatedOrder) => {
    const orderId = toOrderId(unvalidatedOrder.orderId);
    const customerInfo = toCustomerInfo(unvalidatedOrder.customerInfo);
    const checkedShippingAddress = await toCheckedAddress(checkAddressExists, unvalidatedOrder.shippingAddress);
    const shippingAddress = checkedShippingAddress.chain(x => toAddress(x));
    const checkedBillingAddress = await toCheckedAddress(checkAddressExists, unvalidatedOrder.billingAddress);
    const billingAddress = checkedBillingAddress.chain(x => toAddress(x));
    const lines = Either.sequence(
        unvalidatedOrder.lines.map(x => toValidatedOrderLine(checkProductCodeExists, x)).toArray()).map(x => List(x));
    const pricingMethod = createPricingMethod(unvalidatedOrder.promotionCode);
    return combine<ValidationError>().apply5(orderId, customerInfo, shippingAddress, billingAddress, lines)
        .map(([oid, ci, sa, ba, lines]) => new ValidatedOrder(oid, ci, sa, ba, lines, pricingMethod));
}

const toPricedOrderLine = (getProductPrice: GetProductPrice, validatedOrderLine: ValidatedOrderLine):
    Either<PricingError, PricedOrderLine> => {
    const qty = validatedOrderLine.quantity.d;
    const price = getProductPrice(validatedOrderLine.productCode);
    const linePrice = Price.create(qty * price.d).mapLeft(x => new PricingError(x.errorMessage()));
    return linePrice.map(linePrice => new PricedOrderProductLine(
        validatedOrderLine.orderLineId,
        validatedOrderLine.productCode,
        validatedOrderLine.quantity,
        linePrice));
}

const addCommentLine = (pricingMethod: PricingMethod, lines: List<PricedOrderLine>) => {
    switch (pricingMethod.kind) {
        case "standard":
            return lines;
        case "promotionCode":
            const commentLine = new CommentLine(`Applied promotion ${pricingMethod.d}`);
            return lines.push(commentLine);
        default:
            exhaustiveCheck(pricingMethod);
    }
}

const getLinePrice = (line: PricedOrderLine) => {
    switch (line.kind) {
        case "pricedOrderProductLine":
            return line.linePrice;
        case "commentLine":
            return Price.unsafeCreate(0);
        default:
            exhaustiveCheck(line);
    }
}

const priceOrder = (getPricingFunction: GetPricingFunction, validatedOrder: ValidatedOrder) => {
    const getProductPrice = getPricingFunction(validatedOrder.pricingMethod);
    // todo: figure out why this commented out line below returns an 'any' type while breaking it up into two
    // lines like below seems to return the typing as expected

    // const lines = Either.sequence(validatedOrder.lines.map(x => toPricedOrderLine(getProductPrice, x)).toArray())
    //     .map(lines => addCommentLine(validatedOrder.pricingMethod, List(lines)));
    const linesEither = Either.sequence(validatedOrder.lines.map(x => toPricedOrderLine(getProductPrice, x)).toArray());
    const lines = linesEither.map(x => addCommentLine(validatedOrder.pricingMethod, List(x)));
    const amountToBill = lines.map(lines => BillingAmount.sumPrices(lines.map(x => getLinePrice(x))));

    return combine<PricingError>().applyF2(lines, amountToBill).map(([lines, amountToBill]) =>
        new PricedOrder(
        validatedOrder.orderId,
        validatedOrder.customerInfo,
        validatedOrder.shippingAddress,
        validatedOrder.billingAddress,
        amountToBill,
        lines,
        validatedOrder.pricingMethod));
}

type ShippingType = "usLocalState" | "usRemoteState" | "international";

const getShippingType = (address: Address): ShippingType => {
    switch (address.country.d) {
        case "US":
            switch (address.state.d) {
                case "CA":
                case "OR":
                case "AZ":
                case "NV":
                    return "usLocalState";
                default:
                    return "usRemoteState";
            }
        default:
            return "international";
    }
}

export const calculateShippingCost: CalculateShippingCost = (pricedOrder: PricedOrder) => {
    const shippingType = getShippingType(pricedOrder.shippingAddress);
    switch (shippingType) {
        case "usLocalState":
            return Price.unsafeCreate(5);
        case "usRemoteState":
            return Price.unsafeCreate(10);
        case "international":
            return Price.unsafeCreate(20);
        default:
            /* istanbul ignore next */
            exhaustiveCheck(shippingType);
    }
}

const addShippingInfoToOrder: AddShippingInfoToOrder = 
    (calculateShippingCost: CalculateShippingCost, pricedOrder: PricedOrder) => {
    const shippingInfo = new ShippingInfo("fedex24", calculateShippingCost(pricedOrder));
    return new PricedOrderWithShippingMethod(shippingInfo, pricedOrder);
}

const freeVipShipping: FreeVipShipping = (order: PricedOrderWithShippingMethod) => {
    switch (order.pricedOrder.customerInfo.vipStatus.kind) {
        case "normal":
            return order;
        case "vip":
            return new PricedOrderWithShippingMethod(
                new ShippingInfo(order.shippingInfo.shippingMethod, Price.unsafeCreate(0)),
                order.pricedOrder
            );
        default:
            /* istanbul ignore next */
            exhaustiveCheck(order.pricedOrder.customerInfo.vipStatus);
    }
}

const acknowledgeOrder: AcknowledgeOrder = (
    createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter, 
    sendOrderAcknowledgment: SendOrderAcknowledgment, 
    pricedOrderWithShippingMethod: PricedOrderWithShippingMethod) => {
    const pricedOrder = pricedOrderWithShippingMethod.pricedOrder;
    const letter = createOrderAcknowledgmentLetter(pricedOrderWithShippingMethod);
    const acknowledgement = new OrderAcknowledgement(
        pricedOrder.customerInfo.emailAddress,
        letter);
    
    const acknowledgementSentResult = sendOrderAcknowledgment(acknowledgement);
    switch (acknowledgementSentResult) {
        case "sent":
            return Just(new OrderAcknowledgementSent(
                pricedOrder.orderId,
                pricedOrder.customerInfo.emailAddress
            ));
        case "notSent":
            return Nothing;
        default:
            /* istanbul ignore next */
            exhaustiveCheck(acknowledgementSentResult);
    }
}

const makeShipmentLine = (line: PricedOrderLine): Maybe<ShippableOrderLine> => {
    switch (line.kind) {
        case "pricedOrderProductLine":
            return Just(new ShippableOrderLine(line.productCode, line.quantity));
        case "commentLine":
            return Nothing;
        default:
            /* istanbul ignore next */
            exhaustiveCheck(line);
    }
}

const createShippingEvent = (placedOrder: PricedOrder): ShippableOrderPlaced => 
    new ShippableOrderPlaced(
        placedOrder.orderId,
        placedOrder.shippingAddress,
        List(Maybe.catMaybes(placedOrder.lines.map(x => makeShipmentLine(x)).toArray())),
        new PdfAttachment(`Order${placedOrder.orderId.d}`, []));

const createBillingEvent = (placedOrder: PricedOrder): Maybe<BillableOrderPlaced> => 
    placedOrder.amountToBill.d > 0 
        ? Just(new BillableOrderPlaced(
            placedOrder.orderId,
            placedOrder.billingAddress,
            placedOrder.amountToBill))
        : Nothing;

const createEvents: CreateEvents = (
    pricedOrder: PricedOrder, 
    orderAcknowledgementSent: Maybe<OrderAcknowledgementSent>) => {
    const acknowledgmentEvents: Maybe<PlaceOrderEvent> = orderAcknowledgementSent;
    const shippingEvents: PlaceOrderEvent = createShippingEvent(pricedOrder);
    const billingEvents: Maybe<PlaceOrderEvent> = createBillingEvent(pricedOrder);
    return combine().applyM2(acknowledgmentEvents, billingEvents)
        .map(([as, be]) => List([as, shippingEvents, be]))
        .orDefault(List<PlaceOrderEvent>());
}

export const placeOrder = (
    checkProductCodeExists: CheckProductCodeExists,
    checkAddressExists: CheckAddressExists,
    getPricingFunction: GetPricingFunction,
    calculateShippingCost: CalculateShippingCost,
    createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter,
    sendOrderAcknowledgment: SendOrderAcknowledgment): PlaceOrder => {
    return async (unvalidatedOrder: UnvalidatedOrder): Promise<Either<PlaceOrderError, List<PlaceOrderEvent>>> => {
        const validatedOrder = await validateOrder(
            checkProductCodeExists,
            checkAddressExists,
            unvalidatedOrder);
        const pricedOrder = validatedOrder.mapLeft(x => x.first() as PlaceOrderError).chain(vo => priceOrder(getPricingFunction, vo));
        const pricedOrderWithShipping = pricedOrder.map(po => 
            freeVipShipping(
                addShippingInfoToOrder(calculateShippingCost, po)));
        const acknowledgementOption = pricedOrderWithShipping.map(pows => 
                acknowledgeOrder(
                    createOrderAcknowledgmentLetter,
                    sendOrderAcknowledgment,
                    pows));
        const events = combine<PlaceOrderError>().applyF2(pricedOrder, acknowledgementOption).map(([po, ao]) => createEvents(po, ao));
        return events;
    }
}