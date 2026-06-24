const MOCK_BLOB_STORAGE_KEY = "prime-insurance-evidence-blobs";
const MAX_MOCK_FILE_BYTES = 4 * 1024 * 1024;

type StoredEvidence = {
  mime: string;
  name: string;
  dataUrl: string;
};

type EvidenceStore = Record<string, StoredEvidence>;

const blobKey = (claimId: string, documentId: string) => `${claimId}/${documentId}`;

function loadStore(): EvidenceStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(MOCK_BLOB_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvidenceStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: EvidenceStore) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_BLOB_STORAGE_KEY, JSON.stringify(store));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function storeMockEvidenceBlob(claimId: string, documentId: string, file: File): Promise<boolean> {
  if (file.size > MAX_MOCK_FILE_BYTES) {
    return false;
  }
  const dataUrl = await fileToDataUrl(file);
  const store = loadStore();
  store[blobKey(claimId, documentId)] = {
    mime: file.type || "application/octet-stream",
    name: file.name,
    dataUrl
  };
  saveStore(store);
  return true;
}

export function readMockEvidenceBlob(claimId: string, documentId: string): Blob | null {
  const entry = loadStore()[blobKey(claimId, documentId)];
  if (!entry?.dataUrl) {
    return null;
  }
  return dataUrlToBlob(entry.dataUrl);
}

export function removeMockEvidenceBlob(claimId: string, documentId: string) {
  const store = loadStore();
  delete store[blobKey(claimId, documentId)];
  saveStore(store);
}

export function mockStorageKey(claimId: string, documentId: string) {
  return `mock/${claimId}/${documentId}`;
}

export function hasMockEvidenceBlob(claimId: string, documentId: string) {
  return Boolean(loadStore()[blobKey(claimId, documentId)]);
}
