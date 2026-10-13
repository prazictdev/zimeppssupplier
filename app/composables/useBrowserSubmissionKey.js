export const useBrowserSubmissionKey = () => {
  const api = useBidResponse();
  const cryptoTools = useBidCrypto();

  const setSubmissionKeyOnBrowser = async (submissionKey, masterKey) => {
    if (!submissionKey?.uuid) throw new Error('Select a submission key to set up in the browser.');
    if (!masterKey) throw new Error('Unlock the Bid Vault before setting up the submission key.');

    let key = submissionKey;

    if (key.status === 'ACTIVE' && key.storage_mode === 'PORTAL_VAULT') {
      return key;
    }

    if (key.status === 'ACTIVE') {
      const reset = await api.resetKey(
        key.uuid,
        'Move the signing key from a desktop device to the encrypted browser Bid Vault',
      );
      if (!reset.ok) throw new Error(reset.error);
      key = reset.data;
    }

    if (key.status !== 'PENDING_GENERATION') {
      throw new Error(`This submission key is ${key.status} and cannot be set up in the browser.`);
    }

    const challenge = await api.issueKeyChallenge(key.uuid);
    if (!challenge.ok) throw new Error(challenge.error);

    const generated = await cryptoTools.createPortalSigningKey(
      challenge.data.challenge,
      masterKey,
    );
    const registered = await api.registerPortalKey(key.uuid, {
      public_key: generated.publicKey,
      signature: generated.proofSignature,
      encrypted_private_key_envelope: generated.encryptedEnvelope,
    });
    if (!registered.ok) throw new Error(registered.error);

    return registered.data;
  };

  return { setSubmissionKeyOnBrowser };
};
