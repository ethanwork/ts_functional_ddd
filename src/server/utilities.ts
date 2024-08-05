import { CurriedFn, Either, Left, Maybe, number, Right, string, Nothing, Just } from 'purify-ts';
import { List } from "immutable";
import * as yup from "yup";
import { BaseError, FieldError, ValidationError } from "./CommonSimpleTypes";

// combine is good if you want a fail fast type setup where it stops at
// the first failure. if you want to collect all the failures you'd
// probably use the Either.lefts and if the result is an array of length
// greater than 0, then you stop and return, otherwise assume all successes
// and just use unsafeCoerce for them after that. 
// If you have more complex validation/branching control flow, then just
// use if statements with isLeft/isRight and unsafeCoerces and don't try
// to do complicated chainings of map/bind type stuff that is hard to read.
// export const combine = <A>(...args: Either<A, any>[]) => {
//     for(let e of args) {
//         if (e.isLeft()) {
//             return e as Either<A, any>;
//         }
//     }
//     return Right('' as any) as Either<A, any>;
// }

export const isList = (x: any) => x.push !== undefined ? true : false;
export const isEither = (x: any) => x.isLeft !== undefined ? true : false;
export const isError = (x: any) => x.errorMessage !== undefined ? true : false;

class Combine<ErrType extends BaseError> {
    all<T extends { [key: string]: Either<ErrType | List<ErrType>, any>}>(values: T): Either<List<ErrType>, T> {
        let errors = List<ErrType>();
        let messageSet = new Set<string>();
        let k: keyof typeof values;
        for (k in values) {
            const value = values[k];
            // ignore non-either values
            if (!isEither(value)) {
                continue;
            }
            const e: Either<ErrType | List<ErrType>, any> = value as any;
            if (e.isLeft()) {
                e.ifLeft(error => {                
                    if (isList(error)) {
                        (error as List<any>).forEach(x => {
                            // ignore left's that are not error types
                            if (!isError(x)) {
                                return;
                            }
                            // ignore duplicate error messages
                            if (!messageSet.has((x as BaseError).errorMessage())) {
                                messageSet.add((x as BaseError).errorMessage());
                                errors = errors.push(x as ErrType);
                            }
                        });
                    } else {
                        // ignore duplicate error messages
                        const errorMessage = ((error as any) as BaseError).errorMessage();
                        if (!messageSet.has(errorMessage)) {
                            messageSet.add(errorMessage);
                            errors = errors.push(error as ErrType);
                        }                
                    }                
                });
            }
        }
        if (errors.count() > 0) {
            return Left(errors) as Either<List<ErrType>, T>;
        }
        return Right(values) as Either<List<ErrType>, T>;
    }

    // apply1 isn't needed as that would just be using the .map or .chain on an Either
    apply2<A, B>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>): Either<List<ErrType>, [A, B]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce()]);
    }

    applyF2<A, B>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>): 
        Either<ErrType, [A, B]> {
        return this.apply2(a, b).mapLeft(x => x.first() as ErrType);
    }

    applyM2<A, B>(a: Maybe<A>, b: Maybe<B>): 
        Maybe<[A, B]> {
        if ([a, b].map(x => x.isJust()).filter(x => false).length > 0) {
            return Nothing;
        }
        return Just([a.unsafeCoerce(), b.unsafeCoerce()]);
    }

    apply3<A, B, C>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>): Either<List<ErrType>, [A, B, C]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce()]);
    }

    applyF3<A, B, C>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>): 
        Either<ErrType, [A, B, C]> {
        return this.apply3(a, b, c).mapLeft(x => x.first() as ErrType);
    }

    apply4<A, B, C, D>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>)
            : Either<List<ErrType>, [A, B, C, D]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c, d]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce(), d.unsafeCoerce()]);
    }

    applyF4<A, B, C, D>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>): Either<ErrType, [A, B, C, D]> {
        return this.apply4(a, b, c, d).mapLeft(x => x.first() as ErrType);
    }

    apply5<A, B, C, D, E>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>)
            : Either<List<ErrType>, [A, B, C, D, E]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c, d, e]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce(), d.unsafeCoerce(), e.unsafeCoerce()]);
    }

    applyF5<A, B, C, D, E>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>): Either<ErrType, [A, B, C, D, E]> {
        return this.apply5(a, b, c, d, e).mapLeft(x => x.first() as ErrType);
    }

    apply6<A, B, C, D, E, F>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>)
            : Either<List<ErrType>, [A, B, C, D, E, F]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c, d, e, f]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce(), d.unsafeCoerce(), e.unsafeCoerce(),
            f.unsafeCoerce()]);
    }

    applyF6<A, B, C, D, E, F>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>):
            Either<ErrType, [A, B, C, D, E, F]> {
        return this.apply6(a, b, c, d, e, f).mapLeft(x => x.first() as ErrType);
    }

    apply7<A, B, C, D, E, F, G>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>, g: Either<ErrType | List<ErrType>, G>)
            : Either<List<ErrType>, [A, B, C, D, E, F, G]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c, d, e, f, g]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce(), d.unsafeCoerce(), e.unsafeCoerce(),
            f.unsafeCoerce(), g.unsafeCoerce()]);
    }

    applyF7<A, B, C, D, E, F, G>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>, g: Either<ErrType | List<ErrType>, G>):
            Either<ErrType, [A, B, C, D, E, F, G]> {
        return this.apply7(a, b, c, d, e, f, g).mapLeft(x => x.first() as ErrType);
    }

    apply8<A, B, C, D, E, F, G, H>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>, g: Either<ErrType | List<ErrType>, G>,
        h: Either<ErrType | List<ErrType>, H>): Either<List<ErrType>, [A, B, C, D, E, F, G, H]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c, d, e, f, g, h]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce(), d.unsafeCoerce(), e.unsafeCoerce(),
            f.unsafeCoerce(), g.unsafeCoerce(), h.unsafeCoerce()]);
    }

    applyF8<A, B, C, D, E, F, G, H>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>, g: Either<ErrType | List<ErrType>, G>,
        h: Either<ErrType | List<ErrType>, H>): Either<ErrType, [A, B, C, D, E, F, G, H]> {
        return this.apply8(a, b, c, d, e, f, g, h).mapLeft(x => x.first() as ErrType);
    }

    apply9<A, B, C, D, E, F, G, H, I>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>, g: Either<ErrType | List<ErrType>, G>,
        h: Either<ErrType | List<ErrType>, H>, i: Either<ErrType | List<ErrType>, I>): Either<List<ErrType>, [A, B, C, D, E, F, G, H, I]> {
        const errors = this.getDistinctErrors(Either.lefts<ErrType | List<ErrType>, any>([a, b, c, d, e, f, g, h, i]));
        if (errors.count() > 0) {
            return Left(errors);
        }
        return Right([a.unsafeCoerce(), b.unsafeCoerce(), c.unsafeCoerce(), d.unsafeCoerce(), e.unsafeCoerce(),
            f.unsafeCoerce(), g.unsafeCoerce(), h.unsafeCoerce(), i.unsafeCoerce()]);
    }

    applyF9<A, B, C, D, E, F, G, H, I>(a: Either<ErrType | List<ErrType>, A>, b: Either<ErrType | List<ErrType>, B>, c: Either<ErrType | List<ErrType>, C>,
        d: Either<ErrType | List<ErrType>, D>, e: Either<ErrType | List<ErrType>, E>, f: Either<ErrType | List<ErrType>, F>, g: Either<ErrType | List<ErrType>, G>,
        h: Either<ErrType | List<ErrType>, H>, i: Either<ErrType | List<ErrType>, I>): Either<ErrType, [A, B, C, D, E, F, G, H, I]> {
        return this.apply9(a, b, c, d, e, f, g, h, i).mapLeft(x => x.first() as ErrType);
    }

    private getDistinctErrors(errorVals: (ErrType | List<ErrType>)[]) {
        let errors = List<ErrType>();
        let messageSet = new Set<string>();
        errorVals.forEach(error => {
            if (isList(error)) {
                (error as List<any>).forEach(x => {
                    // ignore left's that are not error types
                    if (!isError(x)) {
                        return;
                    }
                    // ignore duplicate error messages
                    if (!messageSet.has((x as BaseError).errorMessage())) {
                        messageSet.add((x as BaseError).errorMessage());
                        errors = errors.push(x as ErrType);
                    }
                });
            } else {
                // ignore duplicate error messages
                const errorMessage = ((error as any) as BaseError).errorMessage();
                if (!messageSet.has(errorMessage)) {
                    messageSet.add(errorMessage);
                    errors = errors.push(error as ErrType);
                }                
            }                
        })
        return errors;
    }
}

export const combine = <T extends BaseError>() => new Combine<T>();

export const sequenceEither = <L, R>(eithers: List<Either<L, R>>): Either<L, List<R> > => {
    return Either.sequence(eithers.toArray()).map(x => List(x));
    // let lefts = List<L>();
    // let rights = List<R>();

    // eithers.forEach(either => {
    //     either.ifLeft(x => lefts = lefts.concat(x));
    //     either.ifRight(x => rights = rights.concat(x));
    // });

    // if (lefts.count() > 0) {
    //     return Left(lefts);
    // } else {
    //     return Right(rights);
    // }
}

// export const sequenceEitherF = <L, R>(eithers: List<Either<L | List<L>, R>>): Either<L, List<R> > => {
//     return sequenceEither(eithers).mapLeft(x => x.first() as L);
// }

export const validateAll = <T>(value: T, schema: yup.BaseSchema<T>): Either<List<FieldError>, T> => {
    let errors: FieldError[] = [];
    try {
      schema.validateSync(value, { abortEarly: false });
    } catch (err: any) {
      err.inner.forEach((e: any) => {
        errors.push(new FieldError(e.message, e.path));
      });
    }
    return errors.length > 0 ? Left(List(errors)) : Right(value);
}

// this function is used at the end of switch's in the default block
// to ensure that the switch has exhausted all possible DU cases
/* istanbul ignore next */
export function exhaustiveCheck(x: never): never {
    return x;
}

export function isNullOrWhiteSpace(str: string){
    return str === undefined || str === null || str.match(/^ *$/) !== null;
}

// use the CurriedFn for multiple param functions, or if it is a single
// param function it already is in curried form
// this actually looks like it works pretty well surprisingly
type CurriedFunc<T, U> = CurriedFn<[T], U> | ((x: T) => U);
export function comp2<T1, T2, T3>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>): (x: T1) => T3 {
    return (t: T1) => b(a(t));
}
export function comp3<T1, T2, T3, T4>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>): (x: T1) => T4 {
    return (t: T1) => c(b(a(t)));
}
export function comp4<T1, T2, T3, T4, T5>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
): (x: T1) => T5 {
    return (t: T1) => d(c(b(a(t))));
}
export function comp5<T1, T2, T3, T4, T5, T6>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
    e: CurriedFunc<T5, T6>,
): (x: T1) => T6 {
    return (t: T1) => e(d(c(b(a(t)))));
}
export function comp6<T1, T2, T3, T4, T5, T6, T7>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
    e: CurriedFunc<T5, T6>,
    f: CurriedFunc<T6, T7>,
): (x: T1) => T7 {
    return (t: T1) => f(e(d(c(b(a(t))))));
}
export function comp7<T1, T2, T3, T4, T5, T6, T7, T8>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
    e: CurriedFunc<T5, T6>,
    f: CurriedFunc<T6, T7>,
    g: CurriedFunc<T7, T8>,
): (x: T1) => T8 {
    return (t: T1) => g(f(e(d(c(b(a(t)))))));
}
export function comp8<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
    e: CurriedFunc<T5, T6>,
    f: CurriedFunc<T6, T7>,
    g: CurriedFunc<T7, T8>,
    h: CurriedFunc<T8, T9>,
): (x: T1) => T9 {
    return (t: T1) => h(g(f(e(d(c(b(a(t))))))));
}
export function comp9<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
    e: CurriedFunc<T5, T6>,
    f: CurriedFunc<T6, T7>,
    g: CurriedFunc<T7, T8>,
    h: CurriedFunc<T8, T9>,
    i: CurriedFunc<T9, T10>,
): (x: T1) => T10 {
    return (t: T1) => i(h(g(f(e(d(c(b(a(t)))))))));
}
export function comp10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c: CurriedFunc<T3, T4>,
    d: CurriedFunc<T4, T5>,
    e: CurriedFunc<T5, T6>,
    f: CurriedFunc<T6, T7>,
    g: CurriedFunc<T7, T8>,
    h: CurriedFunc<T8, T9>,
    i: CurriedFunc<T9, T10>,
    j: CurriedFunc<T10, T11>,
): (x: T1) => T11 {
    return (t: T1) => j(i(h(g(f(e(d(c(b(a(t))))))))));
}

// this version I am unsure how reliable it is for strongly
// enforcing type checks, but has just one function you call
// for different numbers of functions you're composing together
export function comp<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
    a: CurriedFunc<T1, T2>,
    b: CurriedFunc<T2, T3>,
    c?: CurriedFunc<T3, T4>,
    d?: CurriedFunc<T4, T5>,
    e?: CurriedFunc<T5, T6>,
    f?: CurriedFunc<T6, T7>,
    g?: CurriedFunc<T7, T8>,
    h?: CurriedFunc<T8, T9>,
    i?: CurriedFunc<T9, T10>,
    j?: CurriedFunc<T10, T11>
) {
    if (j !== undefined) {
        return (t: T1) => j(i!(h!(g!(f!(e!(d!(c!(b(a(t))))))))));
    }
    if (i !== undefined) {
        return (t: T1) => i(h!(g!(f!(e!(d!(c!(b(a(t)))))))));
    }
    if (h !== undefined) {
        return (t: T1) => h(g!(f!(e!(d!(c!(b(a(t))))))));
    }
    if (g !== undefined) {
        return (t: T1) => g(f!(e!(d!(c!(b(a(t)))))));
    }
    else if (f !== undefined) {
        return (t: T1) => f(e!(d!(c!(b(a(t))))));
    }
    else if (e !== undefined) {
        return (t: T1) => e(d!(c!(b(a(t)))));
    }
    else if (d !== undefined) {
        return (t: T1) => d(c!(b(a(t))));
    }
    else if (c !== undefined) {
        return (t: T1) => c(b(a(t)));
    }
    else {
        return (t: T1) => b(a(t));
    }
}
