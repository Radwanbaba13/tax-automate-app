/**
 * Default text configuration for all Word document types.
 * Organized by document type so each variant can be edited independently.
 *
 * Document types:
 *   individual_en  — Individual client, English document
 *   individual_fr  — Individual client, French document
 *   couple_en      — Couple clients, English document
 *   couple_fr      — Couple clients, French document
 *   multiyear_en   — Multi-year individual, English document
 *   multiyear_fr   — Multi-year individual, French document
 *
 * Each block: { text: string, style: DocBlockStyle }
 * Text may contain {variable} placeholders substituted by Python at generation time.
 * Style applies to the overall block; per-word formatting stays in Python logic.
 */

export interface DocBlockStyle {
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export interface DocTextBlock {
  text: string;
  style: DocBlockStyle;
}

export type DocTypeKey =
  | 'individual_en'
  | 'individual_fr'
  | 'couple_en'
  | 'couple_fr'
  | 'multiyear_en'
  | 'multiyear_fr';

export type DocTextConfig = Record<DocTypeKey, Record<string, DocTextBlock>>;

// ---------------------------------------------------------------------------
// Shared style presets
// ---------------------------------------------------------------------------
const S = {
  default: { bold: false, italic: false, underline: false } as DocBlockStyle,
  bold: { bold: true, italic: false, underline: false } as DocBlockStyle,
  italic: { bold: false, italic: true, underline: false } as DocBlockStyle,
  boldUnderline: { bold: true, italic: false, underline: true } as DocBlockStyle,
  title: { fontSize: 14, color: '#414141', bold: false, italic: false, underline: false, alignment: 'center' as const },
  veryImportant: { color: '#cd3350', bold: true, italic: false, underline: true } as DocBlockStyle,
  red: { color: '#cd3350', bold: false, italic: false, underline: false } as DocBlockStyle,
  resultsHeading: { color: '#cd3350', bold: true, italic: false, underline: false } as DocBlockStyle,
  disclaimer: { fontSize: 8, color: '#7f7f7f', bold: false, italic: true, underline: false } as DocBlockStyle,
  italicAddress: { bold: false, italic: true, underline: false } as DocBlockStyle,
  creditTitle: { bold: true, italic: false, underline: true } as DocBlockStyle,
};

// ---------------------------------------------------------------------------
// Shared blocks (same across document types, only text changes per language)
// ---------------------------------------------------------------------------
function sharedBlocks(lang: 'en' | 'fr', isCouple: boolean): Record<string, DocTextBlock> {
  const isEN = lang === 'en';
  const c = isCouple;

  return {
    veryImportantHeading: {
      text: isEN ? '** Very Important:' : '** TRÈS IMPORTANT :',
      style: S.veryImportant,
    },

    // Quebec + isMailQC — Federal part
    qcMailFedTitle: {
      text: isEN ? 'Regarding your Federal tax return:' : 'Déclaration Fédérale :',
      style: S.boldUnderline,
    },
    qcMailFedNotSubmitted: {
      text: isEN
        ? 'Please be advised that your Federal tax return has not been submitted to the government yet.'
        : "Notez que votre déclaration d'impôt Fédérale n'a pas encore été soumise au gouvernement via EFile.",
      style: S.bold,
    },
    qcMailFedAuthForm: {
      text: isEN
        ? c
          ? 'Attached are two Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your returns.'
          : 'Attached is an Authorization Form. Please e-sign it (or print & sign) and e-mail it back to us as soon as possible so we can EFILE your return.'
        : c
          ? "Vous trouverez ci-joint deux formulaires d'autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre vos déclarations par EFILE."
          : "Vous trouverez ci-joint un formulaire d'autorisation. Veuillez le signer électroniquement (ou imprimer/signer) et nous l'envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.",
      style: S.default,
    },
    qcMailSignPartF: {
      text: isEN ? 'Please sign Part F.' : "S'il vous plaît signer la partie F.",
      style: S.default,
    },

    // Quebec + isMailQC — Quebec part
    qcMailQCTitle: {
      text: isEN ? 'Regarding your Québec tax return:' : 'Déclaration Provinciale :',
      style: S.boldUnderline,
    },
    qcMailQCCannotEfile: {
      text: isEN
        ? 'Please note that your Québec tax return cannot be transmitted via Efile.'
        : 'Veuillez noter que votre déclaration provinciale ne peut pas être transmise via Efile.',
      style: S.default,
    },
    qcMailQCPrint: {
      text: isEN
        ? c
          ? 'For that reason, you need to print the document "QC {year} - {primaryName}.pdf" and "QC {year} - {secondaryName}.pdf", sign at the bottom of page ##, and mail them to the following address:'
          : 'For that reason, you need to print the document "QC {year} - {name}.pdf", sign at the bottom of page ##, and mail it to the following address:'
        : c
          ? 'Pour cette raison, vous devez imprimer le document "QC {year} - {primaryName}.pdf" et "QC {year} - {secondaryName}.pdf", signer en bas de la page ##, et les envoyer par la poste à l\'adresse suivante :'
          : 'Pour cette raison, vous devez imprimer le document "QC {year} - {name}.pdf", signer en bas de la page ##, et l\'envoyer par la poste à l\'adresse suivante :',
      style: S.default,
    },
    qcAddress: {
      text: 'Revenu Québec\nC. P. 2500, succursale Place-Desjardins\nMontréal (Québec) H5B 1A3',
      style: S.italicAddress,
    },
    qcMailOnBehalf: {
      text: isEN
        ? '*If you would like us to mail the declaration on your behalf, please email us the signed declaration (e-signature that looks like your signature), and we will print and mail it by registered mail (with a tracking number) to QC Revenue. Please note that there will be an additional service fee of $25 plus Canada Post fees.'
        : "*Si vous souhaitez qu'on s'occupe d'envoyer la déclaration par la poste à Revenu QC, veuillez nous envoyer par courriel la déclaration signée (par signature électronique qui ressemble à votre signature) et nous l'imprimerons et l'enverrons par courrier recommandé (avec un numéro de suivi) à Revenu QC. Veuillez noter qu'il y aura des frais de service supplémentaires de 25 $ plus les frais de Postes Canada.",
      style: S.default,
    },

    // Quebec + EFILE (not isMailQC)
    qcEfileNotSubmitted: {
      text: isEN
        ? c
          ? 'Please be advised that your tax returns have not been submitted to the government yet.'
          : 'Please be advised that your tax return has not been submitted to the government yet.'
        : c
          ? "Notez que vos déclarations d'impôt n'ont pas encore été soumises au gouvernement via EFile."
          : "Notez que votre déclaration d'impôt n'a pas encore été soumise au gouvernement via EFile.",
      style: S.bold,
    },
    qcEfileAuthForms: {
      text: isEN
        ? c
          ? 'Attached are four Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your returns.'
          : 'Attached are two Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your returns.'
        : c
          ? "Vous trouverez ci-joint quatre formulaires d'autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre vos déclarations par EFILE."
          : "Vous trouverez ci-joint deux formulaires d'autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.",
      style: S.default,
    },
    qcEfileSignFed: {
      text: isEN
        ? 'For the Federal Form, please sign Part F.'
        : 'Pour le formulaire Fédéral, veuillez signer la partie F.',
      style: S.italic,
    },
    qcEfileSignQC: {
      text: isEN
        ? 'For the Quebec Form, please sign at the end of section 4.'
        : 'Pour le formulaire du Québec, veuillez signer à la fin de la section 4.',
      style: S.italic,
    },

    // Non-Quebec
    nonQcNotSubmitted: {
      text: isEN
        ? c
          ? 'Please be advised that your tax returns have not been submitted to the government yet.'
          : 'Please be advised that your tax return has not been submitted to the government yet.'
        : c
          ? "Noter que vos déclarations d'impôt n'ont pas encore été soumises au gouvernement via EFile."
          : "Noter que votre déclaration d'impôt n'a pas encore été soumise au gouvernement via EFile.",
      style: S.bold,
    },
    nonQcAuthForm: {
      text: isEN
        ? c
          ? 'Attached are two Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your returns.'
          : 'Attached is an Authorization Form. Please e-sign it (or print & sign) and e-mail it back to us as soon as possible so we can EFILE your return.'
        : c
          ? "Vous trouverez ci-joint deux formulaires d'autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre vos déclarations par EFILE."
          : "Vous trouverez ci-joint une formulaire d'autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.",
      style: S.default,
    },
    nonQcSignPartF: {
      text: isEN ? 'Please sign Part F.' : 'Veuillez signer la partie F.',
      style: S.italic,
    },

    // Results
    resultsHeading: {
      text: isEN ? 'RESULTS' : 'RÉSULTATS',
      style: S.resultsHeading,
    },
    federalReturnLabel: {
      text: isEN ? 'Federal Tax return' : 'Déclaration Fédérale',
      style: S.bold,
    },
    quebecReturnLabel: {
      text: isEN ? 'Quebec Tax return' : 'Déclaration Provinciale',
      style: S.bold,
    },
    refundPrefix: {
      text: isEN ? 'You are entitled to a refund of' : 'Vous avez droit à un remboursement de',
      style: S.default,
    },
    owingPrefix: {
      text: isEN ? 'You owe the amount of' : 'Vous avez un montant dû de',
      style: S.default,
    },
    noBalance: {
      text: isEN
        ? 'You have no Refund or Balance due.'
        : "Vous n'avez pas de remboursement ni de montant dû.",
      style: S.default,
    },

    // Payment reminder
    paymentOwingFedAndQC: {
      text: isEN
        ? 'You owe an amount on your Federal and Quebec returns;'
        : 'Vous avez un montant dû sur vos déclarations Fédérale et Provinciale ;',
      style: S.italic,
    },
    paymentOwingFed: {
      text: isEN
        ? 'You owe an amount on your Federal return;'
        : 'Vous avez un montant dû sur votre déclaration Fédérale ;',
      style: S.italic,
    },
    paymentOwingQC: {
      text: isEN
        ? 'You owe an amount on your Quebec return;'
        : 'Vous avez un montant dû sur votre déclaration Provinciale ;',
      style: S.italic,
    },
    paymentDeadline: {
      text: isEN
        ? 'please make sure to pay the balance due by April 30, {dueYear}, to avoid paying any interest.'
        : 'veuillez vous assurer de payer le solde dû avant le 30 avril {dueYear} pour éviter de payer des intérêts.',
      style: S.italic,
    },
    paymentHowTo: {
      text: isEN
        ? 'Please wait a few days after we E-file to pay your outstanding balance. For more details on how to pay the amount due, please click on:'
        : 'Veuillez attendre quelques jours après notre transmission par EFILE pour payer votre solde. Pour plus de détails sur la façon de payer le montant dû, veuillez cliquer sur :',
      style: S.italic,
    },

    // Tuition carryforward
    tuitionTitle: {
      text: isEN
        ? 'Your accumulated tuition fees carried forward to future years:'
        : 'Vos frais de scolarité accumulés reportés aux années futures :',
      style: S.bold,
    },
    tuitionFedLabel: {
      text: isEN ? 'Federal (eligible to 15%):  $' : 'Fédéral (admissible à 15%) : $',
      style: S.default,
    },
    tuitionQCLabel: {
      text: isEN ? 'QC (eligible to 8%): $' : 'QC (admissible à 8%) : $',
      style: S.default,
    },
    tuitionExplanation: {
      text: isEN
        ? 'Those accumulated tuition fees are tax credits that you will be using in future tax declarations when you work and pay tax on your income.'
        : "Ces frais de scolarité accumulés sont des crédits d'impôt que vous utiliserez dans de futures déclarations fiscales lorsque vous travaillerez et paierez de l'impôt sur votre revenu.",
      style: S.italic,
    },

    // Credit section titles
    solidarityTitle: { text: isEN ? 'Solidarity Credits:' : 'Crédit de solidarité :', style: S.creditTitle },
    gstTitle: { text: isEN ? 'GST/HST Credits:' : 'Crédits TPS/TVH :', style: S.creditTitle },
    ecgebTitle: {
      text: isEN ? 'Canada Groceries & Essentials Benefit:' : "Allocation canadienne pour l'épicerie :",
      style: S.creditTitle,
    },
    carbonRebateTitle: {
      text: isEN ? 'Canada Carbon Rebate:' : 'Remise canadienne sur le carbone :',
      style: S.creditTitle,
    },
    climateActionTitle: {
      text: isEN ? 'BC Climate Action Tax Credit:' : "Crédit d'impôt pour les mesures climatiques de la C.-B. :",
      style: S.creditTitle,
    },
    ontarioTrilliumTitle: {
      text: isEN ? 'Ontario Trillium Benefit:' : "Prestation Trillium de l'Ontario :",
      style: S.creditTitle,
    },
    ccbTitle: {
      text: isEN ? 'Canada Child Benefit (CCB):' : 'Allocation canadienne pour enfants (ACE) :',
      style: S.creditTitle,
    },
    familyAllowanceTitle: {
      text: isEN ? 'Quebec Family Allowance:' : 'Allocation Famille :',
      style: S.creditTitle,
    },
    carryforwardTitle: {
      text: isEN ? 'Carryforward Amounts:' : 'Montants reportés :',
      style: S.creditTitle,
    },

    // Conclusion
    conclusionWaiting: {
      text: isEN
        ? c
          ? 'We will be waiting for the signed authorization forms to proceed.'
          : 'We will be waiting for the signed authorization form to proceed.'
        : c
          ? "Nous attendons les formulaires d'autorisation signés pour soumettre votre déclaration."
          : "Nous attendons le formulaire d'autorisation signés pour soumettre vos déclarations.",
      style: S.red,
    },
    thankYou: {
      text: isEN ? 'Thank you.' : 'Merci',
      style: S.default,
    },
    disclaimer: {
      text: isEN
        ? 'We at Sankari Inc. are pleased to respond to your tax inquiries and/or file your tax returns based on the information that you provide. Inaccurate or incomplete information provided by you may lead to inadequate or incorrect advice for which Sankari Inc. team cannot be held responsible. You, the client, are responsible for giving correct information and documentation to Sankari Inc.'
        : "Nous, à Sankari Inc., sommes heureux de répondre à vos demandes de renseignements fiscaux et / ou de produire vos déclarations de revenus en fonction des renseignements que vous nous fournissez. Les informations inexactes ou incomplètes fournies par vous peuvent conduire à des conseils inadéquats ou incorrects pour lesquels l'équipe de Sankari Inc. ne peut être tenue pour responsable. Vous, le client est responsable de fournir l'information et la documentation correcte à l'équipe de Sankari Inc.",
      style: S.disclaimer,
    },
  };
}

function makeDocType(
  lang: 'en' | 'fr',
  isCouple: boolean,
  docTitleText: string,
  introAttachmentText: string,
  introCopyNoPrintText: string,
  introCopyKeepText: string,
  introPasswordText: string,
  introCopyDescriptionText: string,
): Record<string, DocTextBlock> {
  const isEN = lang === 'en';
  return {
    docTitle: {
      text: docTitleText,
      style: S.title,
    },
    introAttachment: {
      text: introAttachmentText,
      style: S.default,
    },
    introPassword: {
      text: introPasswordText,
      style: S.bold,
    },
    introCopyDescription: {
      text: introCopyDescriptionText,
      style: S.default,
    },
    introCopyNoPrint: {
      text: introCopyNoPrintText,
      style: S.bold,
    },
    introCopyKeep: {
      text: introCopyKeepText,
      style: S.default,
    },
    ...sharedBlocks(lang, isCouple),
  };
}

export const DEFAULT_DOC_TEXT_CONFIG: DocTextConfig = {
  individual_en: makeDocType(
    'en',
    false,
    'Summary of your {year} Tax Declaration',
    'We have attached all the documents related to your {year} tax declaration.',
    'You do not need to print it or sign it;',
    'please keep it for your records and review it carefully to ensure everything is accurate and complete.',
    'The password consists of the nine digits of your Social Insurance Number.',
    'The document named COPY is a copy of your complete tax return.',
  ),

  individual_fr: makeDocType(
    'fr',
    false,
    "Sommaire de votre déclaration d'impôts {year}",
    "Nous avons joint à ce courriel tous les documents de votre déclaration d'impôts {year}.",
    "Vous n'avez pas besoin de l'imprimer ou de le signer;",
    "vous avez juste besoin de le retenir pour votre dossier. Veuillez revoir la déclaration de revenu attentivement afin de vous assurer qu'elle est exacte et complète.",
    "Le mot de passe se compose des neuf chiffres de votre numéro d'assurance sociale.",
    'Le document nommé COPIE est une copie complète de votre déclaration de revenus.',
  ),

  couple_en: makeDocType(
    'en',
    true,
    'Summary of your {year} Tax Declarations',
    'We have attached all the documents related to your {year} tax declarations.',
    'You do not need to print them or sign them;',
    'please keep them for your records and review them carefully to ensure everything is accurate and complete.',
    'The password consists of the nine digits of your Social Insurance Number.',
    'The document named COPY is a copy of your complete tax return.',
  ),

  couple_fr: makeDocType(
    'fr',
    true,
    "Sommaire de vos déclarations d'impôts {year}",
    "Nous avons joint à ce courriel tous les documents de vos déclarations d'impôts {year}.",
    "Vous n'avez pas besoin de les imprimer ou de les signer;",
    "vous avez juste besoin de les retenir pour votre dossier. Veuillez revoir les déclarations de revenu attentivement afin de vous assurer qu'elles sont exactes et complètes.",
    "Le mot de passe se compose des neuf chiffres de votre numéro d'assurance sociale.",
    'Le document nommé COPIE est une copie complète de votre déclaration de revenus.',
  ),

  multiyear_en: makeDocType(
    'en',
    false,
    'Summary of your {yearRange} Tax Declarations',
    'We have attached all the documents related to your {yearRange} tax declarations.',
    'You do not need to print them or sign them;',
    'please keep them for your records and review them carefully to ensure everything is accurate and complete.',
    'The password consists of the nine digits of your Social Insurance Number.',
    'The document named COPY is a copy of your complete tax return.',
  ),

  multiyear_fr: makeDocType(
    'fr',
    false,
    "Sommaire de vos déclarations d'impôts {yearRange}",
    "Nous avons joint à ce courriel tous les documents de vos déclarations d'impôts {yearRange}.",
    "Vous n'avez pas besoin de les imprimer ou de les signer;",
    "vous avez juste besoin de les retenir pour votre dossier. Veuillez revoir les déclarations de revenu attentivement afin de vous assurer qu'elles sont exactes et complètes.",
    "Le mot de passe se compose des neuf chiffres de votre numéro d'assurance sociale.",
    'Le document nommé COPIE est une copie complète de votre déclaration de revenus.',
  ),
};
