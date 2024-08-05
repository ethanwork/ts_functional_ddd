import { FieldError } from '../../src/server/CommonSimpleTypes';
import * as yup from "yup";
import { isList, List } from 'immutable';
import { validateAll } from '../../src/server/utilities';

test('validateAll for simple type', () => {
  const schema: yup.BaseSchema = yup.string().email("Invalid Email").min(10, "Min length is 10 characters");
  const results = validateAll<string>("test", schema);
  let errors: List<FieldError> = List<FieldError>();  
  results.ifLeft(x => errors = x);
  expect(errors.count()).toBe(2);
});

test('validateAll for object type', () => {
  const schema: yup.BaseSchema = yup.object({
    first: yup.string().required(),
    last: yup.string().required(),
    birthDate: yup
      .date()
      .required()
      .min(new Date(1900, 0, 1))
  });
  const results = validateAll(
    { 
      first: "",
      last: "",
      birthDate: "abc"
    }, schema);
  let errors: List<FieldError> = List<FieldError>();  
  results.ifLeft(x => errors = x);
  expect(errors.count()).toBe(3);
});

test('isList returns true for a List', () => {
  const x = List<string>();
  expect(isList(x)).toBe(true);
});

test('isList returns false for a non-List', () => {
  const x = "";
  expect(isList(x)).toBe(false);
});