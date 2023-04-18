import { MaskedString } from "../model/types";

function fillBuffer(index: number, offset: number, buffer: string[], tempMask: string[], valuec: string[]): void {
  if (index + offset < valuec.length && index < tempMask.length) {
    if ((tempMask[index] === "9" && Number(valuec[index + offset]) > -1 && valuec[index + offset] !== " ") || tempMask[index] === "*") {
      buffer.push(valuec[index + offset]);
    } else {
      if (valuec[index + offset] === tempMask[index]) {
        buffer.push(valuec[index + offset]);
      } else if (tempMask[index] !== "9" && tempMask[index] !== "*") {
        buffer.push(tempMask[index]);
        offset--;
      } else {
        // offset++;
        valuec.splice(index + offset, 1);
        index--;
      }
    }
    fillBuffer(index + 1, offset, buffer, tempMask, valuec);
  }
}

export function applyMask(mask: string | undefined, newValue: string, oldValue?: string): MaskedString {
  const buffer: string[] = [];
  const valuec = newValue.split("");
  if (mask) {
    // the char '{' and '}' should ALWAYS be ignored
    const maskc = mask.split("").filter((c) => c !== "{" && c !== "}");
    // maskc now contains the replaceable chars and the non-replaceable masks at the correct index
    fillBuffer(0, 0, buffer, maskc, valuec);
  } else {
    // send back as is
    buffer.push(...valuec);
  }
  newValue = buffer.join("");
  let cursor = 1;
  // calculate the cursor index
  if (oldValue) {
    const tester = oldValue.split("");
    for (let i = 0, il = buffer.length; i < il; i++) {
      if (buffer[i] !== tester[i]) {
        cursor = i + 1;
        break;
      }
    }
  }
  if (newValue.substring(0, newValue.length - 1) === oldValue) {
    cursor = newValue.length + 1;
  }
  return {
    formattedValue: newValue,
    cursorIndex: cursor,
  };
}

export function removeMask(mask: string | undefined, value: string): string {
  if (!mask) {
    // send back as is
    return (value || "").trim();
  }
  const buffer: string[] = [];
  const valuec = value ? value.split("") : [];
  const maskc = mask.split("");
  let valueIndex = -1;
  let inMask = false;
  for (const c of maskc) {
    valueIndex++;
    // the char '{' and '}' should ALWAYS be ignored
    if (c === "{" || c === "}") {
      valueIndex--;
      inMask = c === "{";
    } else {
      if (inMask && valuec[valueIndex]) {
        buffer.push(valuec[valueIndex]);
      }
    }
  }
  return buffer.join("").trim();
}
