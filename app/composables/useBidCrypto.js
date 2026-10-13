let sodiumPromise;

const sodiumReady = async () => {
  if (!sodiumPromise) {
    sodiumPromise = import('libsodium-wrappers-sumo').then(async ({ default: sodium }) => {
      await sodium.ready;
      return sodium;
    });
  }

  return sodiumPromise;
};

const bytesToBase64 = (bytes) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const useBidCrypto = () => {
  const derivePassphraseKey = async (passphrase, salt, parameters) => {
    const sodium = await sodiumReady();
    return sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      passphrase,
      salt,
      parameters.opslimit,
      parameters.memlimit,
      sodium.crypto_pwhash_ALG_ARGON2ID13,
    );
  };

  const createVault = async (passphrase) => {
    const sodium = await sodiumReady();
    const parameters = {
      opslimit: sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      memlimit: sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    };
    const masterKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const passphraseKey = await derivePassphraseKey(passphrase, salt, parameters);
    const encryptedMasterKey = sodium.crypto_secretbox_easy(masterKey, nonce, passphraseKey);

    const recoveryKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
    const recoveryNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const recoveryEncryptedMasterKey = sodium.crypto_secretbox_easy(masterKey, recoveryNonce, recoveryKey);
    sodium.memzero(passphraseKey);

    return {
      masterKey,
      recoveryCode: bytesToBase64(recoveryKey),
      record: {
        kdf: 'argon2id',
        kdf_parameters: parameters,
        salt: bytesToBase64(salt),
        nonce: bytesToBase64(nonce),
        encrypted_master_key: bytesToBase64(encryptedMasterKey),
        recovery_nonce: bytesToBase64(recoveryNonce),
        recovery_encrypted_master_key: bytesToBase64(recoveryEncryptedMasterKey),
        version: 1,
      },
    };
  };

  const unlockVault = async (record, passphrase) => {
    const sodium = await sodiumReady();
    const passphraseKey = await derivePassphraseKey(
      passphrase,
      base64ToBytes(record.salt),
      record.kdf_parameters,
    );
    const masterKey = sodium.crypto_secretbox_open_easy(
      base64ToBytes(record.encrypted_master_key),
      base64ToBytes(record.nonce),
      passphraseKey,
    );
    sodium.memzero(passphraseKey);
    if (!masterKey) throw new Error('The Bid Vault passphrase is incorrect.');
    return masterKey;
  };

  const unlockVaultWithRecovery = async (record, recoveryCode) => {
    const sodium = await sodiumReady();
    const masterKey = sodium.crypto_secretbox_open_easy(
      base64ToBytes(record.recovery_encrypted_master_key),
      base64ToBytes(record.recovery_nonce),
      base64ToBytes(recoveryCode.trim()),
    );
    if (!masterKey) throw new Error('The Bid Vault recovery code is incorrect.');
    return masterKey;
  };

  const encryptDraft = async (payload, masterKey, existingDraft = null) => {
    const sodium = await sodiumReady();
    let bidKey;

    if (existingDraft?.wrapped_bid_key) {
      bidKey = sodium.crypto_secretbox_open_easy(
        base64ToBytes(existingDraft.wrapped_bid_key),
        base64ToBytes(existingDraft.wrap_nonce),
        masterKey,
      );
    } else {
      bidKey = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
    }
    if (!bidKey) throw new Error('This draft could not be unlocked.');

    const payloadNonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      sodium.from_string(JSON.stringify(payload)),
      null,
      null,
      payloadNonce,
      bidKey,
    );
    const wrapNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const wrappedBidKey = sodium.crypto_secretbox_easy(bidKey, wrapNonce, masterKey);

    return {
      bidKey,
      encrypted_payload: bytesToBase64(ciphertext),
      payload_nonce: bytesToBase64(payloadNonce),
      wrapped_bid_key: bytesToBase64(wrappedBidKey),
      wrap_nonce: bytesToBase64(wrapNonce),
    };
  };

  const decryptDraft = async (draft, masterKey) => {
    const sodium = await sodiumReady();
    const bidKey = sodium.crypto_secretbox_open_easy(
      base64ToBytes(draft.wrapped_bid_key),
      base64ToBytes(draft.wrap_nonce),
      masterKey,
    );
    if (!bidKey) throw new Error('This draft could not be unlocked.');

    const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      base64ToBytes(draft.encrypted_payload),
      null,
      base64ToBytes(draft.payload_nonce),
      bidKey,
    );

    return { bidKey, payload: JSON.parse(sodium.to_string(plaintext)) };
  };

  const encryptEnvelope = async (payload) => {
    const sodium = await sodiumReady();
    const key = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      sodium.from_string(JSON.stringify(payload)),
      null,
      null,
      nonce,
      key,
    );
    return { key, nonce: bytesToBase64(nonce), ciphertext: bytesToBase64(ciphertext) };
  };

  const sealEnvelopeKey = async (key, publicKeyBase64) => {
    const sodium = await sodiumReady();
    return bytesToBase64(sodium.crypto_box_seal(key, base64ToBytes(publicKeyBase64)));
  };

  const sha256 = async (value) => {
    const sodium = await sodiumReady();
    const bytes = typeof value === 'string' ? base64ToBytes(value) : value;
    return sodium.to_hex(sodium.crypto_hash_sha256(bytes));
  };

  // crypto.randomUUID() only exists in a secure context, so the portal falls
  // back to libsodium's CSPRNG. Same RFC 4122 v4 shape, no HTTPS requirement.
  const randomUuid = async () => {
    const sodium = await sodiumReady();
    const bytes = sodium.randombytes_buf(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = sodium.to_hex(bytes);
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-');
  };

  const createPortalSigningKey = async (challengeBase64, masterKey) => {
    const sodium = await sodiumReady();
    const pair = sodium.crypto_sign_keypair();
    const signature = sodium.crypto_sign_detached(base64ToBytes(challengeBase64), pair.privateKey);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(pair.privateKey, nonce, masterKey);

    return {
      publicKey: bytesToBase64(pair.publicKey),
      proofSignature: bytesToBase64(signature),
      privateKey: pair.privateKey,
      encryptedEnvelope: JSON.stringify({
        version: 1,
        algorithm: 'XSALSA20-POLY1305',
        nonce: bytesToBase64(nonce),
        ciphertext: bytesToBase64(ciphertext),
      }),
    };
  };

  const unlockSigningKey = async (envelopeJson, masterKey) => {
    const sodium = await sodiumReady();
    const envelope = typeof envelopeJson === 'string' ? JSON.parse(envelopeJson) : envelopeJson;
    const privateKey = sodium.crypto_secretbox_open_easy(
      base64ToBytes(envelope.ciphertext),
      base64ToBytes(envelope.nonce),
      masterKey,
    );
    if (!privateKey) throw new Error('The portal signing key could not be unlocked.');
    return privateKey;
  };

  const signMessage = async (message, privateKey) => {
    const sodium = await sodiumReady();
    const messageBytes = sodium.from_string(message);
    return {
      signedMessage: bytesToBase64(messageBytes),
      signature: bytesToBase64(sodium.crypto_sign_detached(messageBytes, privateKey)),
    };
  };

  return {
    createVault,
    unlockVault,
    unlockVaultWithRecovery,
    encryptDraft,
    decryptDraft,
    encryptEnvelope,
    sealEnvelopeKey,
    sha256,
    randomUuid,
    createPortalSigningKey,
    unlockSigningKey,
    signMessage,
  };
};
