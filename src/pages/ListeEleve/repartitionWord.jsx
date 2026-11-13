// repartitionWord.js
// À placer à côté de ListeElevePge (même dossier que RepartitionModal.js)
// Dépendance à installer :  npm install docx
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, TableLayoutType, VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";


export const FILLES_EN_PREMIER = true;

const parseInc = (v) => {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d+)\s*([A-Za-z]*)$/);
  if (m) return { n: parseInt(m[1], 10), suf: m[2].toUpperCase() };
  const digits = s.replace(/\D/g, "");
  return {
    n: digits ? parseInt(digits, 10) : Number.POSITIVE_INFINITY,
    suf: s.replace(/[\d\s]/g, "").toUpperCase(),
  };
};

export function compareIncorporation(a, b) {
  const pa = parseInc(a?.numeroIncorporation);
  const pb = parseInc(b?.numeroIncorporation);

  const ga = pa.suf === "F" ? 1 : 0;
  const gb = pb.suf === "F" ? 1 : 0;
  if (ga !== gb) return FILLES_EN_PREMIER ? gb - ga : ga - gb;

  if (pa.n !== pb.n) return pa.n < pb.n ? -1 : 1;
  if (pa.suf !== pb.suf) return pa.suf < pb.suf ? -1 : 1;

  return (
    String(a?.nom ?? "").localeCompare(String(b?.nom ?? ""), "fr", { sensitivity: "base" }) ||
    String(a?.prenom ?? "").localeCompare(String(b?.prenom ?? ""), "fr", { sensitivity: "base" })
  );
}

/******************************************************
 * 2) MODALE : ajouter un fichier Word ou pas ?
 ******************************************************/
export async function demanderExportWord() {
  const res = await Swal.fire({
    title: "Générer aussi un fichier Word ?",
    icon: "question",
    html: `
      <div style="text-align:left;display:grid;gap:10px">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="word-fiches" checked>
          <span><b>Fiches de présence</b> (une page par salle)</span>
        </label>
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="word-repartition" checked>
          <span><b>Répartition par escadron / peloton</b> (avec la salle)</span>
        </label>
        <small style="color:#64748b">La date et les matières seront laissées vides.</small>
      </div>`,
    showCancelButton: true,
    allowOutsideClick: false,
    focusConfirm: false,
    confirmButtonText: "Oui, générer le Word",
    cancelButtonText: "Non, Excel seulement",
    preConfirm: () => {
      const fiches = document.getElementById("word-fiches").checked;
      const repartition = document.getElementById("word-repartition").checked;
      if (!fiches && !repartition) {
        Swal.showValidationMessage("Cochez au moins un document.");
        return false;
      }
      return { fiches, repartition };
    },
  });
  return res.isConfirmed ? res.value : null;
}

/******************************************************
 * 3) OUTILS DOCX
 ******************************************************/
const FONT = "Calibri";
const BORD = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const BORDURES = {
  top: BORD, bottom: BORD, left: BORD, right: BORD,
  insideHorizontal: BORD, insideVertical: BORD,
};

const run = (text, o = {}) =>
  new TextRun({
    text: String(text ?? ""),
    font: FONT,
    size: o.size ?? 22,
    bold: !!o.bold,
    underline: o.underline ? {} : undefined,
    superScript: !!o.sup,
  });

const para = (children, o = {}) =>
  new Paragraph({
    alignment: o.align,
    pageBreakBefore: !!o.pageBreakBefore,
    spacing: { before: o.before ?? 0, after: o.after ?? 0, line: 240 },
    children: Array.isArray(children) ? children : [children],
  });

const cleanLabel = (s) => String(s ?? "").replace(/\u00A0/g, " ").trim();
const gradeOf = (label) => cleanLabel(label).split("—")[0].trim();
const nameOf = (label) => {
  const p = cleanLabel(label).split("—");
  return cleanLabel(p.slice(1).join("—") || p[0] || "");
};

const normSexe = (v) => {
  const s = String(v ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
  if (/^(m|masc|masculin|male|homme|h|garcon|g|boy|1)$/.test(s)) return "M";
  if (/^(f|fem|feminin|female|femme|fille|girl|vavy|2)$/.test(s)) return "F";
  return "";
};

const numOf = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d ? parseInt(d, 10) : Number.POSITIVE_INFINITY;
};

const ordinalRuns = (n, o = {}) => [
  run(String(n), o),
  run(Number(n) === 1 ? "er" : "ème", { ...o, sup: true }),
];

/** colonnes: [{ titre, largeur, align }]  lignes: [[...valeurs]] */
function construireTable({ colonnes, lignes, tailleEntete, tailleLignes, indent }) {
  const total = colonnes.reduce((s, c) => s + c.largeur, 0);
  const cell = (texte, c, o) =>
    new TableCell({
      width: { size: c.largeur, type: WidthType.DXA },
      verticalAlign: VerticalAlign.BOTTOM,
      margins: { top: 0, bottom: 0, left: 70, right: 70 },
      children: [para(run(texte, o), { align: c.align })],
    });

  const entete = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: colonnes.map((c) =>
      cell(c.titre, { ...c, align: c.alignEntete ?? c.align }, { bold: true, size: tailleEntete })
    ),
  });
  const corps = lignes.map(
    (l) =>
      new TableRow({
        cantSplit: true,
        children: colonnes.map((c, i) => cell(l[i], c, { size: tailleLignes })),
      })
  );

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colonnes.map((c) => c.largeur),
    layout: TableLayoutType.FIXED,
    indent: { size: indent, type: WidthType.DXA },
    borders: BORDURES,
    rows: [entete, ...corps],
  });
}

const C = AlignmentType.CENTER;
const L = AlignmentType.LEFT;

const nouveauDocument = (children) =>
  new Document({
    creator: "EGNA",
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

const ordreSalles = (salles) =>
  [...(salles || [])].sort(
    (a, b) =>
      (a.numero === "Reste" ? 1e9 : Number(a.numero)) -
      (b.numero === "Reste" ? 1e9 : Number(b.numero))
  );

/******************************************************
 * 4) FICHES DE PRÉSENCE (une page par salle)
 ******************************************************/
export function construireFichesPresence(salles) {
  const colonnes = [
    { titre: "NR", largeur: 568, align: C, alignEntete: L },
    { titre: "NOM", largeur: 2900, align: L },
    { titre: "PRENOM", largeur: 3200, align: L },
    { titre: "SEXE", largeur: 680, align: C },
    { titre: "ESC", largeur: 600, align: C },
    { titre: "PON", largeur: 600, align: C },
    { titre: "INC", largeur: 700, align: C },
    { titre: "SALLE", largeur: 835, align: C },
    { titre: "", largeur: 700, align: C }, // matière 1 (à remplir)
    { titre: "", largeur: 700, align: C }, // matière 2 (à remplir)
  ];

  const children = [];
  ordreSalles(salles).forEach((salle, idx) => {
    const libelle = salle.numero === "Reste" ? "RESTE" : String(salle.numero);
    const eleves = [...(salle.eleves || [])].sort(compareIncorporation);

    children.push(
      para(run(`FEUILLE D’ÉMARGEMENT – REMISE DES COPIES APRÈS ÉPREUVE  SALLE ${libelle}`, { bold: true, size: 24 }), {
        align: C,
        pageBreakBefore: idx > 0,
      }),
      para(run("DATE : ", { bold: true, size: 24 })),
      para(run("MATIERES : ", { bold: true, size: 24 })),
      para(run("", { size: 24 })),
      construireTable({
        colonnes,
        indent: -431,
        tailleEntete: 24,
        tailleLignes: 22,
        lignes: eleves.map((e, i) => [
          i + 1,
          String(e.nom ?? "").toUpperCase(),
          e.prenom ?? "",
          normSexe(e.sexe ?? e.genre ?? e.gender),
          e.escadron ?? "",
          e.peloton ?? "",
          e.numeroIncorporation ?? "",
          salle.numero,
          "",
          "",
        ]),
      }),
      para(run("LES SURVEILLANTS", { bold: true, underline: true }), { before: 120 })
    );

    (salle.surveillants || []).forEach((lab) =>
      children.push(para(run(`${gradeOf(lab)} ${nameOf(lab)}`)))
    );
  });

  return nouveauDocument(children);
}

/******************************************************
 * 5) RÉPARTITION PAR ESCADRON / PELOTON (avec la salle)
 ******************************************************/
export function construireRepartitionEscadrons(salles) {
  const colonnes = [
    { titre: "NR", largeur: 697, align: C },
    { titre: "NOM", largeur: 2316, align: L, alignEntete: L },
    { titre: "PRENOM", largeur: 4635, align: L, alignEntete: L },
    { titre: "ESC", largeur: 566, align: C },
    { titre: "PON", largeur: 717, align: C },
    { titre: "INC", largeur: 1046, align: C },
    { titre: "SALLE", largeur: 768, align: C },
  ];

  // escadron -> peloton -> [{ e, salle }]
  const arbre = new Map();
  (salles || []).forEach((s) =>
    (s.eleves || []).forEach((e) => {
      const esc = numOf(e.escadron);
      const pel = numOf(e.peloton);
      if (!arbre.has(esc)) arbre.set(esc, new Map());
      const pels = arbre.get(esc);
      if (!pels.has(pel)) pels.set(pel, []);
      pels.get(pel).push({ e, salle: s.numero });
    })
  );

  const children = [];
  let premierEsc = true;
  [...arbre.keys()].sort((a, b) => a - b).forEach((esc) => {
    const pels = arbre.get(esc);
    const escLabel = Number.isFinite(esc) ? esc : "—";

    children.push(
      para(
        [
          run("RÉPARTITION DES ÉLÈVES-GENDARMES DU ", { bold: true, size: 24 }),
          ...ordinalRuns(escLabel, { bold: true, underline: true, size: 24 }),
          run(" ESCADRON", { bold: true, underline: true, size: 24 }),
          run(" PAR SALLE DURANT L’EXAMEN DE FIN FORMATION – JOURNÉE DU ", { bold: true, size: 24 }),
        ],
        { align: C, pageBreakBefore: !premierEsc, after: 160 }
      )
    );
    premierEsc = false;

    let premierPel = true;
    [...pels.keys()].sort((a, b) => a - b).forEach((pel) => {
      const liste = pels.get(pel).sort((x, y) => compareIncorporation(x.e, y.e));
      children.push(
        para(
          [...ordinalRuns(Number.isFinite(pel) ? pel : "—", { bold: true, underline: true }),
            run(" PELOTON", { bold: true, underline: true })],
          { pageBreakBefore: !premierPel, after: 80 }
        ),
        construireTable({
          colonnes,
          indent: -289,
          tailleEntete: 22,
          tailleLignes: 20,
          lignes: liste.map(({ e, salle }, i) => [
            i + 1,
            String(e.nom ?? "").toUpperCase(),
            e.prenom ?? "",
            e.escadron ?? "",
            e.peloton ?? "",
            e.numeroIncorporation ?? "",
            salle,
          ]),
        })
      );
      premierPel = false;
    });
  });

  return nouveauDocument(children);
}

/******************************************************
 * 6) EXPORT (téléchargement des fichiers .docx)
 ******************************************************/
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export async function exporterRepartitionWord(salles, options = {}) {
  const { fiches = true, repartition = true } = options;
  const avecEleves = (salles || []).filter((s) => s && Array.isArray(s.eleves));

  if (fiches) {
    const blob = await Packer.toBlob(construireFichesPresence(avecEleves));
    saveAs(blob, "fiches_presence_salles.docx");
  }
  if (fiches && repartition) await pause(600); // évite le blocage des téléchargements multiples
  if (repartition) {
    const blob = await Packer.toBlob(construireRepartitionEscadrons(avecEleves));
    saveAs(blob, "repartition_par_escadron.docx");
  }
}
