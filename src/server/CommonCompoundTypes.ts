import { List, Maybe } from "purify-ts";
import { EmailAddress, String50, UsStateCode, VipStatus, ZipCode } from "./CommonSimpleTypes";

export class PersonalName {
    kind: "personalName" = "personalName";
	readonly firstName: String50;
    readonly lastName: String50;

    public constructor(firstName: String50, lastName: String50) {
		this.firstName = firstName;
        this.lastName = lastName;
    }
}

export class CustomerInfo {
    kind: "customerInfo" = "customerInfo";
	readonly name: PersonalName;
    readonly emailAddress: EmailAddress;
    readonly vipStatus: VipStatus;

    public constructor(name: PersonalName, emailAddress: EmailAddress, vipStatus: VipStatus) {
		this.name = name;
        this.emailAddress = emailAddress;
        this.vipStatus = vipStatus;
    }
}

export class Address {
    kind: "address" = "address";
	readonly addressLine1: String50;
    readonly addressLine2: Maybe<String50>;
    readonly addressLine3: Maybe<String50>;
    readonly addressLine4: Maybe<String50>;
    readonly city: String50;
    readonly zipCode: ZipCode;
    readonly state: UsStateCode;
    readonly country: String50;

    public constructor(addressLine1: String50, addressLine2: Maybe<String50>, addressLine3: Maybe<String50>, addressLine4: Maybe<String50>, city: String50, zipCode: ZipCode, state: UsStateCode, country: String50) {
		this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.addressLine3 = addressLine3;
        this.addressLine4 = addressLine4;
        this.city = city;
        this.zipCode = zipCode;
        this.state = state;
        this.country = country;
    }
}