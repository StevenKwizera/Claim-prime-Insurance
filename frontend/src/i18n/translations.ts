import { AppLanguage } from "@/utils/language";

export type TranslationKey =
  | "common.welcomeBack"
  | "common.language"
  | "common.logout"
  | "common.alerts"
  | "common.adminConsole"
  | "common.selectClaim"
  | "common.send"
  | "common.downloadCsv"
  | "common.loading"
  | "missing.eyebrow"
  | "missing.title"
  | "missing.description"
  | "missing.builderTitle"
  | "missing.builderHint"
  | "missing.claimLabel"
  | "missing.messageLabel"
  | "missing.sendRequest"
  | "missing.downloadCsv"
  | "missing.queueOpen"
  | "missing.pendingDocs"
  | "missing.claimantsNotified"
  | "missing.templatesTitle"
  | "missing.previewTitle"
  | "missing.previewAuto"
  | "missing.previewHealth"
  | "missing.previewProperty"
  | "missing.autoHint"
  | "missing.healthHint"
  | "missing.propertyHint"
  | "missing.templateAuto"
  | "missing.templateHealth"
  | "missing.templateProperty"
  | "missing.toastSelectClaim"
  | "missing.toastSent"
  | "missing.toastError"
  | "missing.noClaims";

const en: Record<TranslationKey, string> = {
  "common.welcomeBack": "Welcome back",
  "common.language": "Language",
  "common.logout": "Logout",
  "common.alerts": "Alerts",
  "common.adminConsole": "Administrator console",
  "common.selectClaim": "Select a claim",
  "common.send": "Send",
  "common.downloadCsv": "Download CSV",
  "common.loading": "Loading…",
  "missing.eyebrow": "Missing documents",
  "missing.title": "Request additional documents",
  "missing.description": "Request more information on a claim and notify the claimant instantly.",
  "missing.builderTitle": "Request builder",
  "missing.builderHint": "Choose a claim, edit the message, then send a notification to the claimant.",
  "missing.claimLabel": "Claim in review",
  "missing.messageLabel": "Message to claimant",
  "missing.sendRequest": "Send request",
  "missing.downloadCsv": "Download CSV",
  "missing.queueOpen": "Open in queue",
  "missing.pendingDocs": "Pending documents",
  "missing.claimantsNotified": "Ready to notify",
  "missing.templatesTitle": "Quick templates",
  "missing.previewTitle": "Suggested evidence by claim type",
  "missing.previewAuto": "Motor / accident",
  "missing.previewHealth": "Health / medical",
  "missing.previewProperty": "Property damage",
  "missing.autoHint": "Police abstract, vehicle photos, repair estimate",
  "missing.healthHint": "Discharge summary, medical note, signed receipt",
  "missing.propertyHint": "Damage photos, ownership proof, repair quote",
  "missing.templateAuto":
    "Please upload the police abstract, clear photos of vehicle damage, and the garage repair estimate.",
  "missing.templateHealth":
    "Please upload the missing discharge summary, medical note, and signed treatment receipt.",
  "missing.templateProperty":
    "Please upload damage photos, proof of ownership, and a contractor repair quote.",
  "missing.toastSelectClaim": "Select a claim first.",
  "missing.toastSent": "Request sent. The claimant will see it in Notifications.",
  "missing.toastError": "Could not send the request.",
  "missing.noClaims": "No claims are currently in review."
};

const rw: Record<TranslationKey, string> = {
  "common.welcomeBack": "Murakaza neza",
  "common.language": "Ururimi",
  "common.logout": "Gusohoka",
  "common.alerts": "Amakuru",
  "common.adminConsole": "Urubuga rw'ubuyobozi",
  "common.selectClaim": "Hitamo dosiye",
  "common.send": "Ohereza",
  "common.downloadCsv": "Kuramo CSV",
  "common.loading": "Birategereza…",
  "missing.eyebrow": "Inyandiko zibura",
  "missing.title": "Saba inyandiko zinyongera",
  "missing.description": "Saba amakuru yinyongera kuri dosiye maze umenyeshe uwatanze indinganizo ako kanya.",
  "missing.builderTitle": "Igishushanyo cy'ibisabwa",
  "missing.builderHint": "Hitamo dosiye, hindura ubutumwa, hanyuma wohereze ubutumwa ku watanze indinganizo.",
  "missing.claimLabel": "Dosiye irimo isuzumwa",
  "missing.messageLabel": "Ubutumwa ku watanze indinganizo",
  "missing.sendRequest": "Ohereza icyifuzo",
  "missing.downloadCsv": "Kuramo CSV",
  "missing.queueOpen": "Ziri mu murongo",
  "missing.pendingDocs": "Inyandiko zitegereje",
  "missing.claimantsNotified": "Ziteguye kumenyesha",
  "missing.templatesTitle": "Inyandiko zihuse",
  "missing.previewTitle": "Ibimenyetso bisabwa ku bwoko bwa dosiye",
  "missing.previewAuto": "Imodoka / impanuka",
  "missing.previewHealth": "Ubuzima / ubuvuzi",
  "missing.previewProperty": "Imitungo yangiritse",
  "missing.autoHint": "Raporo ya polisi, amafoto y'imodoka, estimate y'igaragaza",
  "missing.healthHint": "Discharge summary, inyandiko y'ubuvuzi, receipt yashyizweho umukono",
  "missing.propertyHint": "Amafoto y'ibyangiritse, icyemezo cy'ubwiganzire, estimate y'ubwubatsi",
  "missing.templateAuto":
    "Nyamuneka upload raporo ya polisi, amafoto asobanutse y'ibyangiritse ku modoka, n'estimate y'igaragaza.",
  "missing.templateHealth":
    "Nyamuneka upload discharge summary ibura, inyandiko y'ubuvuzi, n'receipt y'ubuvuzi yashyizweho umukono.",
  "missing.templateProperty":
    "Nyamuneka upload amafoto y'ibyangiritse, icyemezo cy'ubwiganzire, n'estimate y'ububatsi.",
  "missing.toastSelectClaim": "Banza uhitemo dosiye.",
  "missing.toastSent": "Icyifuzo cyoherejwe. Uwatanze indinganizo azakibona mu makuru.",
  "missing.toastError": "Ntibyashobotse kohereza icyifuzo.",
  "missing.noClaims": "Nta dosiye iri mu isuzuma ubu."
};

const fr: Record<TranslationKey, string> = {
  "common.welcomeBack": "Bon retour",
  "common.language": "Langue",
  "common.logout": "Deconnexion",
  "common.alerts": "Alertes",
  "common.adminConsole": "Console administrateur",
  "common.selectClaim": "Selectionner un dossier",
  "common.send": "Envoyer",
  "common.downloadCsv": "Telecharger CSV",
  "common.loading": "Chargement…",
  "missing.eyebrow": "Documents manquants",
  "missing.title": "Demander des documents supplementaires",
  "missing.description": "Demandez plus d'informations sur un dossier et notifiez le reclamant immediatement.",
  "missing.builderTitle": "Constructeur de demande",
  "missing.builderHint": "Choisissez un dossier, modifiez le message, puis envoyez une notification au reclamant.",
  "missing.claimLabel": "Dossier en revision",
  "missing.messageLabel": "Message au reclamant",
  "missing.sendRequest": "Envoyer la demande",
  "missing.downloadCsv": "Telecharger CSV",
  "missing.queueOpen": "Dans la file",
  "missing.pendingDocs": "Documents en attente",
  "missing.claimantsNotified": "Pret a notifier",
  "missing.templatesTitle": "Modeles rapides",
  "missing.previewTitle": "Preuves suggerees par type de dossier",
  "missing.previewAuto": "Auto / accident",
  "missing.previewHealth": "Sante / medical",
  "missing.previewProperty": "Dommages materiels",
  "missing.autoHint": "Rapport de police, photos du vehicule, devis de reparation",
  "missing.healthHint": "Resume de sortie, note medicale, recu signe",
  "missing.propertyHint": "Photos des degats, preuve de propriete, devis de reparation",
  "missing.templateAuto":
    "Veuillez televerser le rapport de police, des photos claires des degats au vehicule et le devis du garage.",
  "missing.templateHealth":
    "Veuillez televerser le resume de sortie manquant, la note medicale et le recu de traitement signe.",
  "missing.templateProperty":
    "Veuillez televerser des photos des degats, une preuve de propriete et un devis de reparation.",
  "missing.toastSelectClaim": "Selectionnez d'abord un dossier.",
  "missing.toastSent": "Demande envoyee. Le reclamant la verra dans les notifications.",
  "missing.toastError": "Impossible d'envoyer la demande.",
  "missing.noClaims": "Aucun dossier n'est actuellement en revision."
};

export const TRANSLATIONS: Record<AppLanguage, Record<TranslationKey, string>> = { en, rw, fr };

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  rw: "Kinyarwanda",
  fr: "Francais"
};
