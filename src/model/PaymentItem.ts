import {
  AccountOnFile,
  BasicPaymentItem,
  BasicPaymentItems,
  BasicPaymentProduct,
  BasicPaymentProductGroup,
  BasicPaymentProductGroups,
  BasicPaymentProducts,
} from ".";

function listPaymentItems(products: BasicPaymentProducts, groups?: BasicPaymentProductGroups): BasicPaymentItem[] {
  if (!groups) {
    return products.paymentProducts;
  }
  const result: BasicPaymentItem[] = [];
  const groupReplacements: Record<string, true | undefined> = {};
  for (const product of products.paymentProducts) {
    const group = product.paymentProductGroup ? groups.findPaymentProductGroup(product.paymentProductGroup) : undefined;
    if (!group) {
      // The product is not part of an existing group
      result.push(product);
    } else if (!groupReplacements[group.id]) {
      // The product is part of an existing group that hasn't been added yet
      result.push(group);
      groupReplacements[group.id] = true;
    }
    // else the product is part of an existing group that has already been added
  }
  return result;
}

// Cannot seem to get flatMap to work; flatMap manually
function listAccountsOnFile(paymentItems: BasicPaymentItem[]): AccountOnFile[] {
  const result: AccountOnFile[] = [];
  paymentItems.forEach((item) => result.push(...item.accountsOnFile));
  return result;
}

class BasicPaymentItemsImpl implements BasicPaymentItems {
  readonly paymentItems: BasicPaymentItem[];
  readonly accountsOnFile: AccountOnFile[];

  constructor(products: BasicPaymentProducts, groups?: BasicPaymentProductGroups) {
    this.paymentItems = listPaymentItems(products, groups);
    this.accountsOnFile = listAccountsOnFile(this.paymentItems);
  }

  findPaymentItem(id: number): BasicPaymentProduct | undefined;
  findPaymentItem(id: string): BasicPaymentProductGroup | undefined;
  findPaymentItem(id: number | string): BasicPaymentItem | undefined;
  findPaymentItem(id: number | string): BasicPaymentItem | undefined {
    return this.paymentItems.find((item) => item.id === id);
  }

  getPaymentItem(id: number): BasicPaymentProduct;
  getPaymentItem(id: string): BasicPaymentProductGroup;
  getPaymentItem(id: number | string): BasicPaymentItem;
  getPaymentItem(id: number | string): BasicPaymentItem {
    const item = this.findPaymentItem(id);
    if (item) {
      return item;
    }
    throw new Error(`could not find BasicPaymentItem with id ${id}`);
  }

  findAccountOnFile(id: number): AccountOnFile | undefined {
    return this.accountsOnFile.find((accountOnFile) => accountOnFile.id === id);
  }

  getAccountOnFile(id: number): AccountOnFile {
    const accountOnFile = this.findAccountOnFile(id);
    if (accountOnFile) {
      return accountOnFile;
    }
    throw new Error(`could not find AccountOnFile with id ${id}`);
  }
}

Object.freeze(BasicPaymentItemsImpl.prototype);

export function toBasicPaymentItems(products: BasicPaymentProducts, groups?: BasicPaymentProductGroups) {
  return new BasicPaymentItemsImpl(products, groups);
}
