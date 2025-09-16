import SHA256 from "crypto-js/sha256";
import encHex from "crypto-js/enc-hex";

function generateSchemaHash(fields: any[]): string {
  const simplifiedFields = fields.map(f => ({
    fieldname: f.fieldname,
    fieldtype: f.fieldtype,
    options: f.options || ""
  }));

  const sorted = simplifiedFields.sort((a, b) =>
    a.fieldname.localeCompare(b.fieldname)
  );

  const concatStr = sorted
    .map(f => `${f.fieldname}:${f.fieldtype}:${f.options}`)
    .join("|");

  return SHA256(concatStr).toString(encHex);
}
export default generateSchemaHash;