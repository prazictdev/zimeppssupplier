export const useS3Upload = () => {
  const client = useSupplierClient();

  const extractError = (error, fallback) =>
    error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? fallback;

  const resolveContentType = (file) => {
    if (file.type) return file.type;

    const extension = file.name.split('.').pop()?.toLowerCase();
    return {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }[extension] ?? '';
  };

  const presignAndUpload = async (file, folder) => {
    if (!file) {
      return { ok: false, data: null, error: 'No file was selected.' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, data: null, error: 'The selected file must not exceed 10 MB.' };
    }

    const contentType = resolveContentType(file);
    if (!contentType) {
      return { ok: false, data: null, error: 'The selected file type is not supported.' };
    }

    try {
      const response = await client('/api/supplier/v1/uploads/presign', {
        method: 'POST',
        body: {
          folder,
          filename: file.name,
          content_type: contentType,
        },
      });

      const presignedUrl = response?.data?.presigned_url;
      const fileKey = response?.data?.key;
      if (!presignedUrl || !fileKey) {
        return { ok: false, data: null, error: 'The API did not return a valid S3 upload URL.' };
      }

      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });

      if (!uploadResponse.ok) {
        return { ok: false, data: null, error: `S3 upload failed (${uploadResponse.status}).` };
      }

      return {
        ok: true,
        data: {
          file_key: fileKey,
          file_name: file.name,
          mime_type: contentType,
          file_size: file.size,
        },
        error: null,
      };
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, 'File upload failed.') };
    }
  };

  return { presignAndUpload };
};
