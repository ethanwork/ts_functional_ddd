import { String50, EmailAddress, ZipCode, UsStateCode, OrderId, OrderLineId, GizmoCode, WidgetCode, UnitQuantity, KilogramQuantity, Price, BillingAmount, vipStatusCreate } from '../../src/server/CommonSimpleTypes';

test.each([
  ["normal", true],
  ["vip", true],
  ["fakestatus", false],
  ["", false]
])("Is valid VipStatus", (vipStatus: string, expected: boolean) => {
  expect(vipStatusCreate(vipStatus).isRight()).toBe(expected);
});

test('Valid String50 Is Right', () => {
  const valid = String50.create("valid string50");
  expect(valid.isRight()).toBe(true);
});

test('Invalid String50 Is Left', () => {
  const invalid = String50.create("invalid string50aaaaaaaaaaaaa" +
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  expect(invalid.isLeft()).toBe(true);
});

test.each([
  ["invalidemail", false],
  ["validemail@test.com", true]
])("Is valid EmailAddress", (email: string, expected: boolean) => {
  expect(EmailAddress.create(email).isRight()).toBe(expected);
});

test.each([
  ["invalidzipcode", false],
  ["98503", true]
])("Is valid ZipCode", (zipcode: string, expected: boolean) => {
  expect(ZipCode.create(zipcode).isRight()).toBe(expected);
});

test.each([
  ["invalid", false],
  ["CAA", false],
  ["", false],
  ["WA", true],
  ["PA", true]
])("Is valid UsStateCode", (statecode: string, expected: boolean) => {
  expect(UsStateCode.create(statecode).isRight()).toBe(expected);
});

test.each([
  ["invalidorderid", false],
  ["", false],
  [" ", false],
  ["123", true]
])("Is valid OrderId", (orderId: string, expected: boolean) => {
  expect(OrderId.create(orderId).isRight()).toBe(expected);
});

test.each([
  ["invalidorderlineid", false],
  ["", false],
  [" ", false],
  ["123", true]
])("is valid OrderLineId", (orderLineId: string, expected: boolean) => {
  expect(OrderLineId.create(orderLineId).isRight()).toBe(expected);
});

test.each([
  ["invalid widget code", false],
  ["", false],
  [" ", false],
  [null, false],
  [undefined, false],
  ["G1234", false],
  ["W1234", true]
])("is valid WidgetCode", (widgetCode: any, expected: boolean) => {
  expect(WidgetCode.create(widgetCode).isRight()).toBe(expected);
});

test.each([
  ["invalid gizmo code", false],
  ["", false],
  [" ", false],
  ["G123", true]
])("is valid GizmoCode", (gizmoCode: string, expected: boolean) => {
  expect(GizmoCode.create(gizmoCode).isRight()).toBe(expected);
});

test.each([
  [0, false],
  [1, true],
  [5, true],
  [1000, true],
  [1001, false],
  [5.5, false]
])("Is valid UnitQuantity", (unitQuantity: number, expected: boolean) => {
  expect(UnitQuantity.create(unitQuantity).isRight()).toBe(expected);
});

test.each([
  [0, false],
  [101, false],
  [0.05, true],
  [5.5, true],
  [100, true]
])("Is valid KilogramQuantity", (kgQuantity: number, expected: boolean) => {
  expect(KilogramQuantity.create(kgQuantity).isRight()).toBe(expected);
});

test.each([
  [-0.01, false],
  [-1, false],
  [1001, false],
  [0, true],
  [0.05, true],
  [5.5, true],
  [1000, true]
])("Is valid Price", (data: number, expected: boolean) => {
  expect(Price.create(data).isRight()).toBe(expected);
});

test.each([
  [-0.01, false],
  [-1, false],
  [10001, false],
  [0, true],    
  [0.05, true],
  [5.5, true],
  [1000, true],
  [10000, true]
])("Is valid BillingAmount", (data: number, expected: boolean) => {
  expect(BillingAmount.create(data).isRight()).toBe(expected);
});



export {}