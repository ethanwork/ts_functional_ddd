import { placeOrderApi, HttpRequest } from '../../src/server/PlaceOrderApi';
import { CustomerInfoDto, AddressDto, OrderLineDto, OrderFormDto,  } from '../../src/core/DtoTypes';

const getCustomerInfoDto = (): CustomerInfoDto => ({
  firstName: 'fn',
  lastName: 'ln',
  emailAddress: 'email@email.com',
  vipStatus: 'vip',
});

const getAddressDto = (): AddressDto => ({
  addressLine1: 'al1',
  addressLine2: '',
  addressLine3: '',
  addressLine4: '',
  city: 'Olympia',
  zipCode: '98502',
  state: 'WA',
  country: 'US',
});

const getOrderLineDto = (): OrderLineDto => ({
  orderLineId: '1',
  productCode: 'W1234',
  quantity: 5,
});

const getOrderFormDto = (): OrderFormDto => ({
  orderId: '11',
  customerInfo: getCustomerInfoDto(),
  shippingAddress: getAddressDto(),
  billingAddress: getAddressDto(),
  lines: [getOrderLineDto()],
  promotionCode: '',
});

test('placeOrderApi for invalid data', async () => {
  const httpRequest: HttpRequest = {
    uri: '',
    action: '',
    body: '',
  };
  const result = await placeOrderApi(httpRequest);
  expect(result.httpStatusCode).toBe(401);
});

test('placeOrderApi for valid data', async () => {
  const httpRequest: HttpRequest = {
    uri: '',
    action: '',
    body: JSON.stringify(getOrderFormDto()),
  };
  const result = await placeOrderApi(httpRequest);
  expect(result.httpStatusCode).toBe(200);
});

test.each([
  ["Remote state shipping", getOrderFormDto(), 200],
  ["Local state shipping", { shippingAddress: {...getAddressDto(), state: "OR" }}, 200],
  ["International shipping", { shippingAddress: {...getAddressDto(), country: "CA" }}, 200],
  ["Half price promotion", { promotionCode: "HALF" }, 200],
  ["Quarter price promotion", { promotionCode: "QUARTER"}, 200],
  ["Invalid orderId", { orderId: "" }, 401],
  ["Invalid vipStatus", { customerInfo: {...getCustomerInfoDto(), vipStatus: "madeUpStatus"}}, 401]
])("%s", async (testDesc: string, dto: any, responseCode: number) => {
  const baseDto = getOrderFormDto();
  const updatedDto = {...baseDto, ...dto};
  const httpRequest: HttpRequest = {
    uri: '',
    action: '',
    body: JSON.stringify(updatedDto),
  };
  const result = await placeOrderApi(httpRequest);
  expect(result.httpStatusCode).toBe(responseCode);
});

export {};
