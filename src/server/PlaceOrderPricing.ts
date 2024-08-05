import { curry } from 'purify-ts';
import { PromotionCode, ProductCode } from './CommonSimpleTypes';
import { PricingMethod, Standard, GetStandardPrices, GetPromotionPrices, GetPricingFunction } from './PlaceOrderInternalTypes';

export const createPricingMethod = 
    (promotionCode: string): PricingMethod => 
    promotionCode.trim() === "" ?
            new Standard() :
            new PromotionCode(promotionCode);

export const getPricingFunction = (
    standardPrices: GetStandardPrices,
    promoPrices: GetPromotionPrices): GetPricingFunction => {

    const getStandardPrice = standardPrices();

    const getPromotionPrice = (promotionCode: PromotionCode) => {
        let getPromotionPrice = promoPrices(promotionCode);
        return (productCode: ProductCode) => 
            getPromotionPrice(productCode).orDefault(getStandardPrice(productCode));
    }

    const getFinalPrice = (pricingMethod: PricingMethod) => {
        switch (pricingMethod.kind) {
            case "standard":
                return curry(getStandardPrice);
            case "promotionCode":
                return curry(getPromotionPrice)(pricingMethod);
            default:
                const a: never = pricingMethod;
                throw 'exhaustive type check failed';
        }
    };

    return getFinalPrice;
}
