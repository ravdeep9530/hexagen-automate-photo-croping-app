export interface StoredPhotoSession {
  sessionId: string;
  uploadedPhotoUrl?: string | null;
  croppedPhotoUrl?: string | null;
  complianceStatus?: string | null;
}

export interface PhotoStatusDto {
  hasUploaded: boolean;
  hasCropped: boolean;
  uploadedPhotoUrl: string | null;
  croppedPhotoUrl: string | null;
  complianceStatus: string | null;
}

export function mapPhotoSessionToStatus(session: StoredPhotoSession): PhotoStatusDto {
  const uploadedPhotoUrl = session.uploadedPhotoUrl?.trim() || null;
  const croppedPhotoUrl = session.croppedPhotoUrl?.trim() || null;
  const complianceStatus = session.complianceStatus?.trim() || null;

  return {
    hasUploaded: uploadedPhotoUrl !== null,
    hasCropped: croppedPhotoUrl !== null,
    uploadedPhotoUrl,
    croppedPhotoUrl,
    complianceStatus,
  };
}
