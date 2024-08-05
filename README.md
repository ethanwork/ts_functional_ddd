# Typescript functional programming (using DDD)
This project was to see if the F# functional programming design ideas of Scott Wlaschin could be implemented for the most part in Typescript without too many sacrifices.

Scott's book "Domain Modeling Made Functional" is one of my favorite coding books I've ever read, especially for line of business apps and his brilliant way of using the F# type system to help guide a developer working in a project towards writing correct code with fewer errors. Since very few companies use F# in the work environment (which does seem like a bit of a shame how little F# seems to be used as by the end of the book Scott had sold me on it as a fantasic language for business apps), I decided to see if I could adopt many of the functional domain modeling practices he describes in a different language.

C# seemed like it could do a fair amount of the functional design aspects from the book, but was a bit clunky often times in its implementation compared to F#. The other language I primarily used for work was Typescript, and doing a basic prototype with Typescript it worked surprisingly well at implementing many of the same concepts F# was used for in the book.

So this repo is me implementing the main application from the book, only instead of F# to do it in Typescript with a functional style. One example below is that like F#, Typescript also supports exhaustive pattern matching on discriminated unions. In the example below, if a third type of "PricedOrderLine" was defined, then the switch statement in "getLinePrice" would get a compile error until it was updated to handle the new type of PricedOrderLine.

```typescript
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
```

```typescript
export class PricedOrderProductLine {
    kind: "pricedOrderProductLine" = "pricedOrderProductLine";
	readonly orderLineId: OrderLineId;
    readonly productCode: ProductCode;
    readonly quantity: OrderQuantity;
    readonly linePrice: Price;

    public constructor(orderLineId: OrderLineId, productCode: ProductCode, quantity: OrderQuantity, linePrice: Price) {
		this.orderLineId = orderLineId;
        this.productCode = productCode;
        this.quantity = quantity;
        this.linePrice = linePrice;
    }
}

export class CommentLine {
    kind: "commentLine" = "commentLine";
    readonly d: string;

    public constructor(d: string) {
        this.d = d;
    }
}

export type PricedOrderLine = PricedOrderProductLine | CommentLine;
```