const fs = require('fs');
const crypto = require('crypto');
const protobuf = require('protobufjs');

const PROTO_SOURCE = `
syntax = "proto3";
message Block { BlockHeader header = 1; BlockData data = 2; BlockMetadata metadata = 3; }
message BlockHeader { uint64 number = 1; bytes previous_hash = 2; bytes data_hash = 3; }
message BlockData { repeated bytes data = 1; }
message BlockMetadata { repeated bytes metadata = 1; }
message Metadata { bytes value = 1; repeated MetadataSignature signatures = 2; }
message MetadataSignature { bytes signature_header = 1; bytes signature = 2; bytes identifier_header = 3; }
message SignatureHeader { bytes creator = 1; bytes nonce = 2; }
message SerializedIdentity { string mspid = 1; bytes id_bytes = 2; }
`;

function derLength(length) {
  if (length < 0x80) return Buffer.from([length]);
  let hex = length.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  const bytes = Buffer.from(hex, 'hex');
  return Buffer.concat([Buffer.from([0x80 | bytes.length]), bytes]);
}

function derTlv(tag, value) {
  return Buffer.concat([Buffer.from([tag]), derLength(value.length), value]);
}

function derInteger(value) {
  if (value === 0n) return derTlv(0x02, Buffer.from([0]));
  let hex = value.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let bytes = Buffer.from(hex, 'hex');
  if (bytes[0] & 0x80) bytes = Buffer.concat([Buffer.from([0]), bytes]);
  return derTlv(0x02, bytes);
}

function blockHeaderBytes(header) {
  const number = BigInt(header.number.toString());
  const body = Buffer.concat([
    derInteger(number),
    derTlv(0x04, Buffer.from(header.previousHash)),
    derTlv(0x04, Buffer.from(header.dataHash)),
  ]);
  return derTlv(0x30, body);
}

const blockPath = process.argv[2];
if (!blockPath) throw new Error('usage: node verify_block_sig.js <block.pb>');

const root = protobuf.parse(PROTO_SOURCE).root;
const Block = root.lookupType('Block');
const Metadata = root.lookupType('Metadata');
const SignatureHeader = root.lookupType('SignatureHeader');
const SerializedIdentity = root.lookupType('SerializedIdentity');
const block = Block.decode(fs.readFileSync(blockPath));
const metadata = Metadata.decode(block.metadata.metadata[0]);
const headerBytes = blockHeaderBytes(block.header);
console.log(`block number=${block.header.number} header bytes len=${headerBytes.length} (ASN.1 DER)`);

for (let i = 0; i < metadata.signatures.length; i += 1) {
  const signature = metadata.signatures[i];
  const signatureHeader = SignatureHeader.decode(signature.signatureHeader);
  const identity = SerializedIdentity.decode(signatureHeader.creator);
  const certificate = new crypto.X509Certificate(Buffer.from(identity.idBytes).toString('utf8'));
  // Fabric signs Metadata.Value || raw SignatureHeader || ASN.1 BlockHeaderBytes.
  const signedData = Buffer.concat([
    Buffer.from(metadata.value),
    Buffer.from(signature.signatureHeader),
    headerBytes,
  ]);
  fs.writeFileSync('/tmp/host/signed-data.bin', signedData);
  fs.writeFileSync('/tmp/host/stored-sig.bin', Buffer.from(signature.signature));
  fs.writeFileSync('/tmp/host/signer-cert.pem', Buffer.from(identity.idBytes));
  const verifier = crypto.createVerify('SHA256');
  verifier.update(signedData);
  verifier.end();
  const valid = verifier.verify(certificate.publicKey, Buffer.from(signature.signature));
  console.log(`signature[${i}]: mspid=${identity.mspid} subject=${JSON.stringify(certificate.subject)} valid=${valid}`);
}
