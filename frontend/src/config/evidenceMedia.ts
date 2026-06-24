import { ClaimType, EvidenceKind } from "@/types";

/**
 * Prime Insurance demo evidence — local files under `public/evidence/`.
 * Run `npm run evidence:fetch` to download themed stock photos.
 */
export const PROJECT_EVIDENCE = {
  images: {
    autoDamageFront: "/evidence/auto-damage-front.jpg",
    autoDamageSide: "/evidence/auto-damage-side.jpg",
    autoLicense: "/evidence/auto-license-plate.jpg",
    autoScene: "/evidence/auto-accident-scene.jpg",
    autoScratch: "/evidence/auto-scratch-closeup.jpg",
    autoParking: "/evidence/auto-parking-context.jpg",
    autoTotalLoss: "/evidence/auto-total-loss.jpg",
    autoEngine: "/evidence/auto-engine-fire.jpg",
    healthWard: "/evidence/health-hospital-ward.jpg",
    healthPrescription: "/evidence/health-prescription.jpg",
    healthUltrasound: "/evidence/health-ultrasound.jpg",
    healthDental: "/evidence/health-dental-xray.jpg",
    healthPostOp: "/evidence/health-post-procedure.jpg",
    propertyFloodRoom: "/evidence/property-flood-living-room.jpg",
    propertyWaterLine: "/evidence/property-water-damage.jpg",
    propertyRoofLeak: "/evidence/property-roof-leak.jpg",
    propertyFire: "/evidence/property-fire-damage.jpg",
    propertyStormWall: "/evidence/property-storm-wall.jpg",
    propertyStormYard: "/evidence/property-storm-yard.jpg",
    propertyBrokenWindow: "/evidence/property-broken-window.jpg",
    billingReceipt: "/evidence/billing-receipt.jpg",
    billingPharmacy: "/evidence/billing-pharmacy-receipt.jpg",
    identityId: "/evidence/identity-id-card.jpg"
  },
  videos: {
    dashcam: "/evidence/video-dashcam-drive.mp4",
    propertyWalk: "/evidence/video-property-walkthrough.mp4",
    clinicWalk: "/evidence/video-clinic-tour.mp4",
    droneSurvey: "/evidence/video-drone-site-survey.mp4",
    insuranceOffice: "/evidence/video-insurance-consultation.mp4"
  }
} as const;

export const DEMO_EVIDENCE_VIDEO_URL = PROJECT_EVIDENCE.videos.insuranceOffice;

type PickInput = {
  tag: string;
  kind: EvidenceKind;
  name: string;
  docKey: string;
  claimType?: ClaimType;
};

export type EvidenceDocInput = {
  tag: string;
  kind: EvidenceKind;
  name: string;
  id: string;
};

const IMG = PROJECT_EVIDENCE.images;
const VID = PROJECT_EVIDENCE.videos;

const AUTO_POOL = [
  IMG.autoDamageFront,
  IMG.autoDamageSide,
  IMG.autoScene,
  IMG.autoScratch,
  IMG.autoTotalLoss
];

const HEALTH_POOL = [
  IMG.healthWard,
  IMG.healthPrescription,
  IMG.healthUltrasound,
  IMG.healthPostOp,
  IMG.healthDental
];

const PROPERTY_POOL = [
  IMG.propertyFloodRoom,
  IMG.propertyWaterLine,
  IMG.propertyRoofLeak,
  IMG.propertyFire,
  IMG.propertyBrokenWindow
];

function nameHints(name: string) {
  const n = name.toLowerCase();
  return {
    accident:
      n.includes("acc") ||
      n.includes("accident") ||
      n.includes("crash") ||
      n.includes("collision") ||
      n.includes("motor") ||
      n.includes("auto") ||
      n.includes("car"),
    medical:
      n.includes("sick") ||
      n.includes("health") ||
      n.includes("hospital") ||
      n.includes("medical") ||
      n.includes("clinic") ||
      n.includes("patient") ||
      n.includes("steve") ||
      n.includes("ward"),
    property:
      n.includes("property") ||
      n.includes("house") ||
      n.includes("home") ||
      n.includes("flood") ||
      n.includes("fire") ||
      n.includes("roof") ||
      n.includes("storm") ||
      n.includes("netops"),
    bumper: n.includes("bumper") || n.includes("front"),
    rear: n.includes("rear") || n.includes("panel") || n.includes("dent"),
    plate: n.includes("license") || n.includes("plate"),
    dashcam: n.includes("dashcam"),
    scratch: n.includes("scratch"),
    parking: n.includes("parking"),
    total: n.includes("total loss") || n.includes("overview"),
    engine: n.includes("engine"),
    scene: n.includes("scene") || n.includes("wide"),
    ward: n.includes("ward") || n.includes("patient"),
    prescription: n.includes("prescription"),
    ultrasound: n.includes("ultrasound"),
    dental: n.includes("dental") || n.includes("x-ray") || n.includes("xray"),
    postOp: n.includes("post-procedure") || n.includes("procedure"),
    flood: n.includes("flood") || n.includes("living room"),
    water: n.includes("water") || n.includes("kitchen"),
    roof: n.includes("roof") || n.includes("leak"),
    fire: n.includes("fire") || n.includes("smoke"),
    storm: n.includes("storm"),
    wall: n.includes("wall") || n.includes("collapsed"),
    yard: n.includes("yard"),
    window: n.includes("window") || n.includes("entry"),
    receipt: n.includes("receipt") || n.includes("payment"),
    pharmacy: n.includes("pharmacy"),
    id: n.includes("id") || n.includes("national")
  };
}

export function pickImageByClaimType(claimType: ClaimType | undefined, docKey: string): string {
  const pool =
    claimType === "health" ? HEALTH_POOL : claimType === "property" ? PROPERTY_POOL : AUTO_POOL;
  return pool[hashDocKey(docKey) % pool.length];
}

/** Pick a project-themed still image from filename, tag, and claim type. */
export function pickProjectImage(input: PickInput): string {
  const h = nameHints(input.name);
  if (h.bumper || h.accident) return IMG.autoDamageFront;
  if (h.rear) return IMG.autoDamageSide;
  if (h.plate) return IMG.autoLicense;
  if (h.scratch) return IMG.autoScratch;
  if (h.parking) return IMG.autoParking;
  if (h.total) return IMG.autoTotalLoss;
  if (h.engine || h.fire) return h.engine ? IMG.autoEngine : IMG.propertyFire;
  if (h.scene) return IMG.autoScene;
  if (h.medical || h.ward) return IMG.healthWard;
  if (h.prescription) return IMG.healthPrescription;
  if (h.ultrasound) return IMG.healthUltrasound;
  if (h.dental) return IMG.healthDental;
  if (h.postOp) return IMG.healthPostOp;
  if (h.property || h.flood) return IMG.propertyFloodRoom;
  if (h.water) return IMG.propertyWaterLine;
  if (h.roof) return IMG.propertyRoofLeak;
  if (h.wall) return IMG.propertyStormWall;
  if (h.yard) return IMG.propertyStormYard;
  if (h.window) return IMG.propertyBrokenWindow;
  if (h.pharmacy) return IMG.billingPharmacy;
  if (h.receipt) return IMG.billingReceipt;
  if (h.id) return IMG.identityId;

  if (input.tag === "damage") {
    const pool = [IMG.autoDamageFront, IMG.propertyFloodRoom, IMG.propertyFire, IMG.propertyStormWall];
    return pool[hashDocKey(input.docKey) % pool.length];
  }
  if (input.tag === "medical") {
    return HEALTH_POOL[hashDocKey(input.docKey) % HEALTH_POOL.length];
  }
  if (input.tag === "billing") {
    return hashDocKey(input.docKey) % 2 === 0 ? IMG.billingReceipt : IMG.billingPharmacy;
  }
  if (input.tag === "vehicle" || input.tag === "scene") {
    return input.tag === "vehicle" ? IMG.autoLicense : IMG.autoScene;
  }
  if (input.tag === "identity") {
    return IMG.identityId;
  }

  if (input.claimType) {
    return pickImageByClaimType(input.claimType, input.docKey);
  }

  const fallback = [...AUTO_POOL, ...HEALTH_POOL, ...PROPERTY_POOL];
  return fallback[hashDocKey(input.docKey) % fallback.length];
}

/** Pick a project-themed clip from filename and claim type. */
export function pickProjectVideo(input: PickInput): string {
  const h = nameHints(input.name);
  if (h.dashcam || input.claimType === "auto") return VID.dashcam;
  if (h.flood || input.name.toLowerCase().includes("property") || input.name.toLowerCase().includes("walkthrough")) {
    return VID.propertyWalk;
  }
  if (h.medical || h.ward || input.name.toLowerCase().includes("clinic") || input.claimType === "health") {
    return VID.clinicWalk;
  }
  if (input.name.toLowerCase().includes("drone") || input.name.toLowerCase().includes("survey")) {
    return VID.droneSurvey;
  }
  if (input.claimType === "property") {
    return VID.propertyWalk;
  }
  const pool = [VID.dashcam, VID.propertyWalk, VID.clinicWalk, VID.droneSurvey, VID.insuranceOffice];
  return pool[hashDocKey(input.docKey) % pool.length];
}

export function resolveProjectEvidenceUrl(
  claimId: string,
  doc: EvidenceDocInput,
  claimType?: ClaimType
): string | undefined {
  const docKey = `${claimId}-${doc.id}`;
  const input: PickInput = { tag: doc.tag, kind: doc.kind, name: doc.name, docKey, claimType };
  if (doc.kind === "image") {
    return pickProjectImage(input);
  }
  if (doc.kind === "video") {
    return pickProjectVideo(input);
  }
  return undefined;
}

function hashDocKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}
