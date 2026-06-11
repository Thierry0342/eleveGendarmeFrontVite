import React, { useRef, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import EleveService from '../../services/eleveService';
import courService from '../../services/courService';
import pointureService from '../../services/pointure-service';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const DiverPage = () => {
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [filteredPointures, setFilteredPointures] = useState([]);
  const [filter, setFilter] = useState({
    cour: '', diplome: '', religion: '', genreConcours: '',
    Specialiste: '', fady: '', ageRange: null,
    specialiteCategorie: '',
  });
  const [pointures, setPointures] = useState([]);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // FIX 2 : état pour la recherche dans le tableau des spécialités
  const [specialiteSearch, setSpecialiteSearch] = useState('');
  // Recherche globale par nom/prénom/matricule/escadron/peloton/incorporation
  const [searchQuery, setSearchQuery] = useState('');
  const tableRef = useRef(null);

  const niveauxEtude = ['BACC','BACC +1','BACC +2','BACC +3','BACC +4','BACC +5','BACC +6','BACC +7','BACC +8'];
  const ethnies = [
    "ANTAIFASY","ANTAIMORO","ANTAMBAHOAKA","ANTANDROY","ANTANOSY","ANTAKARANA",
    "BARA","BEZANOZANO","BETSILEO","BETSIMISARAKA","MAHAFALY","MERINA",
    "MIKEA","SAKALAVA","SIHANAKA","TANALA","TSIMIHETY","VEZO","ANTESAKA","MASIKORO"
  ];
  const genresConcours = ['ordinaire', 'specialiste', 'veuve', 'orphelin', 'ex-militaire'];
  const specialiste = ['Info-Telecom', 'topo', 'mecanicien', 'infrastructure', 'Plombier', 'sport'];

  const initialFilter = {
    cour: '', diplome: '', religion: '', fady: '',
    genreConcours: '', Specialiste: '', ageRange: null,
    specialiteCategorie: '',
  };

  const resetFilters = () => {
    setFilter(prev => ({ ...initialFilter, cour: prev.cour }));
    setSpecialiteSearch('');
    setSearchQuery('');
  };
  const [detailSearch, setDetailSearch] = useState('');
  const [detailOnlySearch, setDetailOnlySearch] = useState('');

  const isFilterEmpty =
    !filter.diplome && !filter.religion && !filter.fady &&
    !filter.genreConcours && !filter.Specialiste &&
    !filter.ageRange && !filter.specialiteCategorie && !searchQuery;

  // ==========================================
  // FETCH DATA
  // ==========================================
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data.sort((a, b) => b.cour - a.cour);
        setCours(coursData);
        if (coursData.length > 0) {
          setFilter(prev => ({ ...prev, cour: coursData[0].cour.toString() }));
        }
      } catch (err) {}
    };
    fetchCours();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const limit = 500;
    let currentOffset = 0;
    let allEleves = [];

    const fetchAllEleves = async () => {
      try {
        while (true) {
          const response = await EleveService.getPaginated(limit, currentOffset);
          const data = response.data;
          if (!Array.isArray(data) || data.length === 0) break;
          allEleves = [...allEleves, ...data];
          currentOffset += limit;
          if (data.length < limit) break;
        }
        if (isMounted) setEleves(allEleves);
      } catch (error) {}
    };

    fetchAllEleves();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    pointureService.get()
      .then(response => {
        if (Array.isArray(response.data)) setPointures(response.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const result = pointures.filter(p =>
      filter.cour ? p.Eleve?.cour?.toString() === filter.cour : true
    );
    setFilteredPointures(result);
  }, [pointures, filter.cour]);

 const handleFilterClick = (nouveauFiltre) => {
  setFilter(nouveauFiltre);
  setDetailSearch('');
  setDetailOnlySearch(''); // ← ajout
  setTimeout(() => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
};

  // ==========================================
  // FILTRE ÉLÈVES
  // FIX 1 : matchSpecialiteCategorie utilise includes() insensible à la casse
  // pour la recherche partielle (ex: "info" trouve "INFORMATIQUE")
  // ==========================================
  const filteredEleves = eleves.filter(e => {
    const age = dayjs().diff(dayjs(e.dateNaissance), 'year');

    const matchSpecialiste = filter.genreConcours !== 'specialiste'
      || (e.genreConcours === 'specialiste' && (!filter.Specialiste || e.Specialiste === filter.Specialiste));

    const fadyMatch = filter.fady
      ? filter.fady === 'AUTRES'
        ? !ethnies.includes(e.fady?.toUpperCase())
        : e.fady?.toUpperCase() === filter.fady
      : true;

    // FIX 1 : recherche partielle avec includes() insensible à la casse
    const searchTerm = filter.specialiteCategorie.toUpperCase().trim();
    const matchSpecialiteCategorie = searchTerm
      ? (e.specialites && e.specialites.some(
          sp => sp.categorie?.toUpperCase().includes(searchTerm)
        )) || e.SpecialisteAptitude?.toUpperCase().includes(searchTerm)
      : true;

    // Recherche globale : nom, prénom, matricule, escadron, peloton, n° incorporation, CIN
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || [
      e.nom, e.prenom, e.matricule,
      e.escadron?.toString(), e.peloton?.toString(),
      e.numeroIncorporation?.toString(), e.CIN,
      e.numCandidature?.toString(), e.centreConcours,
    ].some(val => val?.toLowerCase().includes(q));

    return (
      (filter.cour ? e.cour?.toString() === filter.cour : true) &&
      (filter.diplome ? e.niveau === filter.diplome : true) &&
      (filter.religion ? e.religion === filter.religion : true) &&
      fadyMatch &&
      (filter.ageRange ? age >= filter.ageRange.min && age <= filter.ageRange.max : true) &&
      (filter.genreConcours ? e.genreConcours === filter.genreConcours : true) &&
      (filter.Specialiste ? e.Specialiste === filter.Specialiste : true) &&
      matchSpecialiste &&
      matchSpecialiteCategorie &&
      matchSearch
    );
  });

  // ==========================================
  // CATÉGORIES UNIQUES NORMALISÉES
  // ==========================================
  const getCategoriesUniques = () => {
    const map = new Map();
    eleves
      .filter(e => filter.cour ? e.cour?.toString() === filter.cour : true)
      .forEach(e => {
        if (e.specialites && e.specialites.length > 0) {
          e.specialites.forEach(sp => {
            if (sp.categorie?.trim()) {
              const key = sp.categorie.trim().toUpperCase();
              map.set(key, (map.get(key) || 0) + 1);
            }
          });
        } else if (e.SpecialisteAptitude?.trim()) {
          const key = e.SpecialisteAptitude.trim().toUpperCase();
          map.set(key, (map.get(key) || 0) + 1);
        }
      });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  };

  // ==========================================
  // AGES
  // ==========================================
  const ages = filteredEleves
    .map(e => dayjs().diff(dayjs(e.dateNaissance), 'year'))
    .filter(age => age >= 17 && age <= 60);

  const minAge = ages.length > 0 ? Math.min(...ages) : 'N/A';
  const maxAge = ages.length > 0 ? Math.max(...ages) : 'N/A';

  const tranchesAge = [
    { label: '17-20 ans', min: 17, max: 20 },
    { label: '21-24 ans', min: 21, max: 24 },
    { label: '25-29 ans', min: 25, max: 29 },
    { label: '30 ans et +', min: 30, max: 60 }
  ];

  // ==========================================
  // COLONNES TABLEAU
  // ==========================================
  const columns = [
    {
      name: 'Nom et prénom',
      selector: row => row.nom + " " + row.prenom,
      sortable: true,
      cell: row => (
        <span
          style={{ cursor: 'pointer', color: '#0d6efd', fontWeight: 600 }}
          onClick={() => { setSelectedEleve(row); setShowDetailModal(true); }}
        >
          {row.nom} {row.prenom}
        </span>
      )
    },
    { name: 'Escadron', selector: row => row.escadron, width: "100px" , sortable: true},
    { name: 'Peloton', selector: row => row.peloton, width: "100px" ,sortable: true },
    {
      name: 'Âge', width: "80px",
      selector: row => {
        const age = dayjs().diff(dayjs(row.dateNaissance), 'year');
        return age >= 17 && age <= 100 ? age : 'N/A';
      }, sortable: true
    },
    { name: 'Niveau', selector: row => row.niveau, width: "100px" },
    { name: 'Concours', selector: row => row.genreConcours, width: "110px" },
    { name: 'Religion', selector: row => row.religion },
    { name: 'Foko', selector: row => row.fady },
    { name: 'Sexe', selector: row => row.sexe, width: "80px" },
    {
      name: 'Spécialité(s)',
      cell: row => {
        if (row.specialites && row.specialites.length > 0) {
          return (
            <div className="d-flex flex-wrap gap-1 py-1">
              {row.specialites.map((sp, i) => (
                <span key={i} className="badge bg-primary" style={{ fontSize: '0.7rem' }}>
                  {sp.categorie}
                </span>
              ))}
            </div>
          );
        }
        return row.SpecialisteAptitude
          ? <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{row.SpecialisteAptitude}</span>
          : <span className="text-muted">—</span>;
      },
      wrap: true,
    },
  ];

  const columns2 = [
    { name: 'Nom et prénoms', selector: row => (row.Eleve?.nom + " " + row.Eleve?.prenom) || '-', sortable: true },
    { name: 'Escadron', selector: row => row.Eleve?.escadron || '-', sortable: true },
    { name: 'Peloton', selector: row => row.Eleve?.peloton || '-', sortable: true },
    { name: 'Chemise', selector: row => row.tailleChemise || '-', sortable: true },
    { name: 'Tête', selector: row => row.tourTete || '-', sortable: true },
    { name: 'Pantalon', selector: row => row.pointurePantalon || '-', sortable: true },
    { name: 'Chaussure', selector: row => row.pointureChaussure || '-', sortable: true },
  ];

  // ==========================================
  // IMPRESSION PDF
  // ==========================================
  const handlePrint = () => {
    const filteredTableRows = filteredEleves.sort((a, b) => {
      const escA = parseInt(a.escadron, 10);
      const escB = parseInt(b.escadron, 10);
      if (escA !== escB) return escA - escB;
      return parseInt(a.peloton, 10) - parseInt(b.peloton, 10);
    });

    const groupedByEscadron = {};
    filteredTableRows.forEach(eleve => {
      const escNum = parseInt(eleve.escadron, 10);
      if (!groupedByEscadron[escNum]) groupedByEscadron[escNum] = [];
      groupedByEscadron[escNum].push(eleve);
    });

    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(11);
    doc.text("ECOLE DE LA GENDARMERIE NATIONALE", 5, y);
    doc.text("AMBOSITRA", 35, y + 7);
    doc.text("----------------------", 32, y + 10);
    doc.text("DIRECTION DE L'INSTRUCTION", 17, y + 17);
    doc.text("REPOBLIKAN'I MADAGASCAR", 150, y);
    doc.text("Fitiavana - Tanindrazana - Fandrosoana", 145, y + 7);

    y += 40;

    let filterText = '';
    if (filter.cour) filterText += `Cours : ${filter.cour}  `;
    if (filter.diplome) filterText += `| Diplôme : ${filter.diplome}  `;
    if (filter.religion) filterText += `| Religion : ${filter.religion}  `;
    if (filter.fady) filterText += `| Foko : ${filter.fady}  `;
    if (filter.ageRange) filterText += `| Âge : ${filter.ageRange.label}`;
    if (filter.genreConcours) filterText += `| Concours : ${filter.genreConcours}  `;
    if (filter.specialiteCategorie) filterText += `| Spécialité : ${filter.specialiteCategorie}  `;
    if (!filterText) filterText = 'Aucun filtre appliqué';

    doc.setFontSize(12);
    doc.text(filterText, 14, y);
    y += 10;

    Object.keys(groupedByEscadron).sort((a, b) => a - b).forEach((escNum) => {
      const escLabel = parseInt(escNum) === 1 ? '1er escadron' : `${escNum}ème escadron`;
      const elevesEsc = groupedByEscadron[escNum];

      doc.setFontSize(13);
      doc.text(escLabel, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['Nom et prénoms', 'Escadron', 'Peloton', 'Incorporation', 'Spécialité']],
        body: elevesEsc.map(e => [
          e.nom + ' ' + e.prenom,
          e.escadron,
          e.peloton,
          e.numeroIncorporation,
          e.specialites?.length > 0
            ? e.specialites.map(sp => sp.categorie).join(', ')
            : e.SpecialisteAptitude || '—'
        ]),
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        theme: 'striped',
        didDrawPage: (data) => { y = data.cursor.y + 10; }
      });
    });

    doc.save('liste_eleves.pdf');
  };

  // ==========================================
  // EXPORT PDF POINTURE
  // ==========================================
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });
    const coursVal = filter?.cour ?? "N/A";

    const byEscadron = new Map();
    (filteredPointures ?? []).forEach((r) => {
      const esc = r?.Eleve?.escadron ?? "-";
      const pel = r?.Eleve?.peloton ?? "-";
      if (!byEscadron.has(esc)) byEscadron.set(esc, new Map());
      const pelMap = byEscadron.get(esc);
      if (!pelMap.has(pel)) pelMap.set(pel, []);
      pelMap.get(pel).push(r);
    });

    const head = ["INC", "Nom et prénoms", "Esc", "Pon", "Chemise", "Tête", "Pantalon", "Chaussure"];
    let firstPage = true;

    Array.from(byEscadron.keys())
      .sort((a, b) => ("" + a).localeCompare("" + b, "fr", { numeric: true }))
      .forEach((esc) => {
        const pelMap = byEscadron.get(esc);
        Array.from(pelMap.keys())
          .sort((a, b) => ("" + a).localeCompare("" + b, "fr", { numeric: true }))
          .forEach((pel) => {
            if (!firstPage) doc.addPage();
            firstPage = false;

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`Fiche Pointure — Cours ${coursVal} — Escadron ${esc} — Peloton ${pel}`, 40, 40);

            const data = (pelMap.get(pel) || [])
              .sort((r1, r2) => String(r1?.Eleve?.numeroIncorporation ?? "").localeCompare(String(r2?.Eleve?.numeroIncorporation ?? ""), "fr", { numeric: true }))
              .map((row) => [
                row?.Eleve?.numeroIncorporation ?? "-",
                row?.Eleve ? `${row.Eleve.nom} ${row.Eleve.prenom}` : "-",
                row?.Eleve?.escadron ?? "-",
                row?.Eleve?.peloton ?? "-",
                row?.tailleChemise ?? "-",
                row?.tourTete ?? "-",
                row?.pointurePantalon ?? "-",
                row?.pointureChaussure ?? "-",
              ]);

            autoTable(doc, {
              startY: 60,
              head: [head],
              body: data,
              styles: { fontSize: 9, cellPadding: 4 },
              headStyles: { fillColor: [41, 128, 185], halign: "center", fontStyle: "bold", textColor: 255 },
              theme: "striped",
              margin: { left: 40, right: 40 },
            });
          });
      });

    doc.save(`pointures-cours-${coursVal}.pdf`);
  };

  // ==========================================
  // EXPORT EXCEL
  // ==========================================
  const safeSheetName = (s) =>
    (String(s ?? '-').replace(/[\\/*?:[\]]/g, '_').slice(0, 31)) || '-';

  const exportExcel = async () => {
    try {
      const coursVal = filter?.cour ?? 'N/A';
      const wb = new ExcelJS.Workbook();
      wb.created = new Date();

      const byEscadron = new Map();
      (filteredPointures ?? []).forEach((r) => {
        const esc = r?.Eleve?.escadron ?? '-';
        const pel = r?.Eleve?.peloton ?? '-';
        if (!byEscadron.has(esc)) byEscadron.set(esc, new Map());
        const pelMap = byEscadron.get(esc);
        if (!pelMap.has(pel)) pelMap.set(pel, []);
        pelMap.get(pel).push(r);
      });

      const cols = [
        { header: 'Nom', key: 'nom', width: 18 },
        { header: 'Prénom', key: 'prenom', width: 22 },
        { header: 'INC', key: 'inc', width: 14 },
        { header: 'Esc', key: 'esc', width: 6 },
        { header: 'Pon', key: 'pon', width: 6 },
        { header: 'Chemise', key: 'chemise', width: 12 },
        { header: 'Tête', key: 'tete', width: 10 },
        { header: 'Pantalon', key: 'pantalon', width: 12 },
        { header: 'Chaussure', key: 'chaussure', width: 12 },
      ];

      const edge = { style: 'thin', color: { argb: 'FF000000' } };

      for (const [escadron, pelMap] of byEscadron) {
        const ws = wb.addWorksheet(safeSheetName(`Escadron ${escadron}`), {
          properties: { tabColor: { argb: 'FF2980B9' } },
          pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'portrait' },
        });

        for (const peloton of Array.from(pelMap.keys()).sort((a, b) => ('' + a).localeCompare('' + b, 'fr', { numeric: true }))) {
          const titleRowIdx = ws.addRow([`Peloton ${peloton}`]).number;
          ws.mergeCells(`A${titleRowIdx}:I${titleRowIdx}`);
          const titleCell = ws.getCell(`A${titleRowIdx}`);
          titleCell.font = { bold: true };
          titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F3FC' } };

          ws.columns = cols;
          const headerRow = ws.addRow(cols.map(c => c.header));
          headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
            cell.border = { top: edge, left: edge, bottom: edge, right: edge };
          });

          (pelMap.get(peloton) || [])
            .sort((r1, r2) => String(r1?.Eleve?.numeroIncorporation ?? '').localeCompare(String(r2?.Eleve?.numeroIncorporation ?? ''), 'fr', { numeric: true }))
            .forEach((r) => {
              const row = ws.addRow({
                nom: r?.Eleve?.nom ?? '-',
                prenom: r?.Eleve?.prenom ?? '-',
                inc: r?.Eleve?.numeroIncorporation ?? '-',
                esc: r?.Eleve?.escadron ?? '-',
                pon: r?.Eleve?.peloton ?? '-',
                chemise: r?.tailleChemise ?? '-',
                tete: r?.tourTete ?? '-',
                pantalon: r?.pointurePantalon ?? '-',
                chaussure: r?.pointureChaussure ?? '-',
              });
              row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle' };
                cell.border = { top: edge, left: edge, bottom: edge, right: edge };
              });
            });

          ws.addRow([]);
        }
      }

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Pointures-cours-${coursVal}.xlsx`);
    } catch (e) {
      alert("Erreur lors de l'export Excel.");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="container mt-4">

      {/* ======= SÉLECTION COURS + RECHERCHE ======= */}
      <div className="card shadow-sm border-0 mb-4 p-3">
        <div className="row align-items-end g-3">
          <div className="col-md-3">
            <label className="form-label fw-bold">📅 Sélectionner un cours :</label>
            <select
              className="form-select"
              value={filter.cour}
              onChange={e => setFilter({ ...filter, cour: e.target.value })}
            >
              {cours.map((c) => (
                <option key={c.id} value={c.cour}>{c.cour}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">🔎 Recherche rapide :</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Nom, prénom, matricule..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Effacer"
                >✕</button>
              )}
            </div>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Nom · Prénom · Matricule · Escadron · Peloton · N° Inc. · CIN
            </small>
          </div>
          <div className="col-md-3">
            {/* FIX 1 : placeholder plus explicite sur la recherche partielle */}
            <label className="form-label fw-bold">🎓 Rechercher une spécialité :</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: info, topo, sport... (recherche partielle)"
              value={filter.specialiteCategorie}
              onChange={e => setFilter({ ...filter, specialiteCategorie: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={resetFilters}
              disabled={isFilterEmpty}
            >
              🔄 Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Badge résumé des filtres actifs */}
        {!isFilterEmpty && (
          <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
            <small className="text-muted align-self-center">Filtres actifs :</small>
            {searchQuery && (
              <span className="badge rounded-pill bg-dark" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')}>
                🔎 "{searchQuery}" ✕
              </span>
            )}
            {filter.diplome && (
              <span className="badge rounded-pill bg-success" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, diplome: '' }))}>
                📚 {filter.diplome} ✕
              </span>
            )}
            {filter.religion && (
              <span className="badge rounded-pill bg-info text-dark" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, religion: '' }))}>
                ✝ {filter.religion} ✕
              </span>
            )}
            {filter.fady && (
              <span className="badge rounded-pill bg-info text-dark" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, fady: '' }))}>
                🌍 {filter.fady} ✕
              </span>
            )}
            {filter.genreConcours && (
              <span className="badge rounded-pill bg-warning text-dark" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, genreConcours: '', Specialiste: '' }))}>
                🏆 {filter.genreConcours} ✕
              </span>
            )}
            {filter.Specialiste && (
              <span className="badge rounded-pill bg-info text-dark" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, Specialiste: '' }))}>
                🧪 {filter.Specialiste} ✕
              </span>
            )}
            {filter.ageRange && (
              <span className="badge rounded-pill bg-primary" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, ageRange: null }))}>
                🎯 {filter.ageRange.label} ✕
              </span>
            )}
            {filter.specialiteCategorie && (
              <span className="badge rounded-pill bg-primary" style={{ cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, specialiteCategorie: '' }))}>
                🎓 {filter.specialiteCategorie} ✕
              </span>
            )}
          </div>
        )}
      </div>

      {/* ======= TABLEAU ÉLÈVES ======= */}
      <div ref={tableRef}>
        <DataTable
          title={
            <div className="d-flex flex-wrap align-items-center justify-content-between w-100">
              <div>
                <h5 className="mb-1 fw-bold text-primary">
                  📋 Liste des élèves
                  {filter.cour && ` · Cour ${filter.cour}`}
                  {filter.diplome && ` · ${filter.diplome}`}
                  {filter.religion && ` · ${filter.religion}`}
                  {filter.fady && ` · ${filter.fady}`}
                  {filter.genreConcours && ` · ${filter.genreConcours}`}
                  {filter.Specialiste && ` · ${filter.Specialiste}`}
                  {filter.specialiteCategorie && ` · Spécialité: ${filter.specialiteCategorie}`}
                  {filter.ageRange && ` · Âge ${filter.ageRange.label}`}
                </h5>
                <small className="text-muted">{filteredEleves.length} élève(s) — cliquer sur un nom pour voir les détails</small>
              </div>
            </div>
          }
          columns={columns}
          data={filteredEleves}
          pagination
          highlightOnHover
          striped
          responsive
          dense
          persistTableHead
          onRowClicked={(row) => { setSelectedEleve(row); setShowDetailModal(true); }}
          customStyles={{
            headRow: { style: { backgroundColor: '#0d6efd', color: '#fff' } },
            headCells: { style: { fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' } },
            rows: {
              style: { fontSize: '14px', minHeight: '48px', cursor: 'pointer' },
              highlightOnHoverStyle: { backgroundColor: '#e8f0fe' },
            },
            table: { style: { border: '1px solid #dee2e6', borderRadius: '0.5rem', overflow: 'hidden' } },
          }}
        />
        <div className="d-flex justify-content-end mt-3">
          <button onClick={handlePrint} className="btn btn-outline-primary">
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* ======= ÂGE MIN/MAX ======= */}
      <div className="card shadow-sm border-0 p-3 mt-4">
        <div className="d-flex gap-4 flex-wrap">
          <div><span className="text-muted">Âge minimum :</span> <strong>{minAge} ans</strong></div>
          <div><span className="text-muted">Âge maximum :</span> <strong>{maxAge} ans</strong></div>
          <div><span className="text-muted">Total filtré :</span> <strong>{filteredEleves.length} élèves</strong></div>
        </div>
      </div>

      {/* ======= SPÉCIALITÉS / APTITUDES — FIX 2 : tableau compact ======= */}
      <div className="mt-5">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h5 className="fw-bold text-primary text-uppercase mb-0">🎓 Filtrer par Spécialité / Aptitude</h5>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              {getCategoriesUniques().length} spécialité(s) au total
            </span>
            {filter.specialiteCategorie && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setFilter({ ...filter, specialiteCategorie: '' })}
              >
                ✕ Effacer filtre
              </button>
            )}
          </div>
        </div>

        {/* Barre de recherche interne au tableau des spécialités */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ maxWidth: '300px' }}
            placeholder="🔎 Filtrer cette liste..."
            value={specialiteSearch}
            onChange={e => setSpecialiteSearch(e.target.value)}
          />
        </div>
        {/* Recherche sur le champ Détail uniquement */}
<div className="mb-3 d-flex align-items-center gap-2" style={{ maxWidth: '400px' }}>
  <div className="input-group">
    <span className="input-group-text bg-white border-end-0"
      style={{ fontSize: '0.8rem', color: '#6c757d' }}>
      Détail
    </span>
    <input
      type="text"
      className="form-control border-start-0"
      placeholder="Filtrer par détail..."
      value={detailOnlySearch}
      onChange={e => setDetailOnlySearch(e.target.value)}
    />
    {detailOnlySearch && (
      <button
        className="btn btn-outline-secondary"
        onClick={() => setDetailOnlySearch('')}
        title="Effacer"
      >✕</button>
    )}
  </div>
</div>

        {/* Tableau compact des spécialités */}
        <div className="card border-0 shadow-sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table table-sm table-hover mb-0">
            <thead className="table-primary sticky-top">
              <tr>
                <th style={{ width: '50%' }}>Spécialité / Aptitude</th>
                <th style={{ width: '20%' }} className="text-center">Effectif</th>
                <th style={{ width: '30%' }} className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Ligne "Tout afficher" */}
              <tr
                className={!filter.specialiteCategorie ? 'table-secondary fw-bold' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => handleFilterClick({ ...filter, specialiteCategorie: '' })}
              >
                <td>
                  <span className="me-2">📋</span>
                  Toutes les spécialités
                </td>
                <td className="text-center">
                  <span className="badge bg-dark">{filteredEleves.length}</span>
                </td>
                <td className="text-center">
                  {!filter.specialiteCategorie && (
                    <span className="badge bg-secondary">Actif</span>
                  )}
                </td>
              </tr>

              {getCategoriesUniques()
                .filter(({ label }) =>
                  !specialiteSearch || label.toLowerCase().includes(specialiteSearch.toLowerCase())
                )
                .map(({ label, count }) => {
                  // FIX 2 : la sélection dans le tableau utilise l'égalité exacte sur le label normalisé
                  const isActive = filter.specialiteCategorie.toUpperCase() === label;
                  return (
                    <tr
                      key={label}
                      className={isActive ? 'table-primary' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleFilterClick({
                        ...filter,
                        specialiteCategorie: isActive ? '' : label
                      })}
                    >
                      <td>
                        <span className="me-2">🎓</span>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                          {label}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${isActive ? 'bg-white text-primary' : 'bg-primary'}`}>
                          {count}
                        </span>
                      </td>
                      <td className="text-center">
                        {isActive ? (
                          <span className="badge bg-primary">✓ Sélectionné</span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Cliquer pour filtrer
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {getCategoriesUniques().filter(({ label }) =>
                !specialiteSearch || label.toLowerCase().includes(specialiteSearch.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center text-muted fst-italic py-3">
                    Aucune spécialité trouvée pour "{specialiteSearch}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======= DÉTAILS SPÉCIALITÉ SÉLECTIONNÉE ======= */}
      {/* ======= DÉTAILS SPÉCIALITÉ SÉLECTIONNÉE ======= */}
{filter.specialiteCategorie && (
  <div className="mt-4 p-3 border rounded bg-white shadow-sm">
    <h6 className="fw-bold text-primary mb-3">📊 Détails — {filter.specialiteCategorie}</h6>

    {/* Badges niveaux */}
    <div className="d-flex flex-wrap gap-2 mb-3">
      {['Licencié', 'En cours de licence', 'Autodidacte'].map(niveau => {
        const count = filteredEleves.filter(e =>
          e.specialites?.some(sp =>
            sp.categorie?.toUpperCase() === filter.specialiteCategorie.toUpperCase() &&
            sp.niveauQualification === niveau
          )
        ).length;
        const colors = { 'Licencié': 'success', 'En cours de licence': 'warning', 'Autodidacte': 'info' };
        return (
          <span key={niveau} className={`badge bg-${colors[niveau]} text-dark p-2`} style={{ fontSize: '0.85rem' }}>
            {niveau} : {count}
          </span>
        );
      })}
    </div>

    {/* Barre de recherche */}
    <div className="mb-3 d-flex align-items-center gap-2" style={{ maxWidth: '400px' }}>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder="Nom, prénom, escadron, peloton,details..."
          value={detailSearch}
          onChange={e => setDetailSearch(e.target.value)}
        />
        {detailSearch && (
          <button
            className="btn btn-outline-secondary"
            onClick={() => setDetailSearch('')}
            title="Effacer"
          >✕</button>
        )}
      </div>
    </div>

    {/* Tableau */}
  

   {(() => {
  const q = detailSearch.toLowerCase().trim();

  const rows = [];
  filteredEleves.forEach((e, i) => {
    const searchTerm = filter.specialiteCategorie.toUpperCase();
    const sps = e.specialites?.filter(sp =>
      sp.categorie?.toUpperCase().includes(searchTerm)
    );
    if (sps && sps.length > 0) {
      sps.forEach((sp, j) => {
        rows.push({ eleve: e, sp, key: `${i}-${j}`, type: 'specialite' });
      });
    } else if (e.SpecialisteAptitude?.toUpperCase().includes(searchTerm)) {
      rows.push({ eleve: e, sp: null, key: `old-${i}`, type: 'ancien' });
    }
  });

  const filtered = q
    ? rows.filter(({ eleve, sp }) =>
        [
          eleve.nom, eleve.prenom,
          eleve.escadron?.toString(), eleve.peloton?.toString(),
          sp?.detail, eleve.SpecialisteAptitude,
        ].some(val => val?.toLowerCase().includes(q))
      )
    : rows;

  const filteredByDetail = detailOnlySearch.trim()
    ? filtered.filter(({ sp }) =>
        sp?.detail?.toLowerCase().includes(detailOnlySearch.toLowerCase().trim())
      )
    : filtered;

  return (
    <>
      <table className="table table-sm table-striped table-bordered">
        <thead className="table-primary">
          <tr>
            <th>Nom et Prénom</th>
            <th>Escadron</th>
            <th>Peloton</th>
            <th>Spécialité</th>
            <th>Détail</th>
            <th>Niveau</th>
          </tr>
        </thead>
        <tbody>
          {filteredByDetail.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center text-muted fst-italic py-3">
                Aucun résultat
                {detailSearch && ` pour "${detailSearch}"`}
                {detailOnlySearch && ` · détail "${detailOnlySearch}"`}
              </td>
            </tr>
          ) : (
            filteredByDetail.map(({ eleve, sp, key, type }) => (
              <tr key={key} style={{ cursor: 'pointer' }}
                onClick={() => { setSelectedEleve(eleve); setShowDetailModal(true); }}>
                <td className="text-primary fw-semibold">{eleve.nom} {eleve.prenom}</td>
                <td>{eleve.escadron}</td>
                <td>{eleve.peloton}</td>
                <td>
                  <span className={`badge ${type === 'ancien' ? 'bg-secondary' : 'bg-primary'}`}>
                    {type === 'ancien' ? eleve.SpecialisteAptitude : sp.categorie}
                  </span>
                </td>
                <td>{type === 'ancien' ? '—' : (sp.detail || '—')}</td>
                <td>
                  {type === 'ancien' ? (
                    <span className="badge bg-secondary">Ancien</span>
                  ) : (
                    <span className={`badge ${
                      sp.niveauQualification === 'Licencié' ? 'bg-success' :
                      sp.niveauQualification === 'En cours de licence' ? 'bg-warning text-dark' :
                      'bg-info text-dark'
                    }`}>
                      {sp.niveauQualification || '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <small className="text-muted">
        {(detailSearch || detailOnlySearch)
          ? `${filteredByDetail.length} résultat(s) sur ${rows.length}`
          : `${rows.length} élève(s) au total`
        }
      </small>
    </>
  );
})()}
      
          </div>
        )}

      {/* ======= TRANCHE D'ÂGE ======= */}
      <h5 className="mt-5 fw-bold text-primary text-uppercase">🎯 Filtrer par tranche d'âge</h5>
      <div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
        {tranchesAge.map((tranche) => {
          const isActive = filter.ageRange?.label === tranche.label;
          const matchingCount = eleves.filter(e => {
            const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
            return age >= tranche.min && age <= tranche.max &&
              (!filter.cour || e.cour?.toString() === filter.cour);
          }).length;
          return (
            <div
              key={tranche.label}
              className={`card text-center shadow-sm border filter-card ${isActive ? 'border-primary bg-primary-subtle' : 'border-0 bg-white'}`}
              style={{ cursor: 'pointer', width: '160px' }}
              onClick={() => handleFilterClick({ ...filter, ageRange: tranche })}
            >
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">{tranche.label}</h6>
                <span className="badge bg-primary">{matchingCount} élèves</span>
              </div>
            </div>
          );
        })}
        <div
          className="card text-center shadow-sm border bg-light filter-card"
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => handleFilterClick({ ...filter, ageRange: null })}
        >
          <div className="card-body p-3">
            <h6 className="fw-bold mb-1">Tout afficher</h6>
            <span className="badge bg-dark">{filteredEleves.length} élèves</span>
          </div>
        </div>
      </div>

      {/* ======= NIVEAU D'ÉTUDE ======= */}
      <h5 className="mt-5 fw-bold text-primary text-uppercase">📚 Filtrer par niveau d'étude</h5>
      <div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
        {niveauxEtude.map((niveau) => {
          const isActive = filter.diplome === niveau;
          const matchingCount = eleves.filter(e =>
            e.niveau === niveau &&
            (!filter.cour || e.cour?.toString() === filter.cour)
          ).length;
          return (
            <div
              key={niveau}
              className={`card text-center shadow-sm border filter-card ${isActive ? 'border-success bg-success-subtle' : 'border-0 bg-white'}`}
              style={{ cursor: 'pointer', width: '160px' }}
              onClick={() => handleFilterClick({ ...filter, diplome: niveau })}
            >
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">{niveau}</h6>
                <span className="badge bg-success">{matchingCount} élèves</span>
              </div>
            </div>
          );
        })}
        <div
          className="card text-center shadow-sm border bg-light filter-card"
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => handleFilterClick({ ...filter, diplome: '' })}
        >
          <div className="card-body p-3">
            <h6 className="fw-bold mb-1">Tout afficher</h6>
            <span className="badge bg-dark">{filteredEleves.length} élèves</span>
          </div>
        </div>
      </div>

      {/* ======= GENRE CONCOURS ======= */}
      <h5 className="mt-5 fw-bold text-primary text-uppercase">🏆 Filtrer par genre de concours</h5>
      <div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
        {genresConcours.map((genre) => {
          const isActive = filter.genreConcours === genre;
          const count = eleves.filter(e =>
            e.genreConcours === genre &&
            (!filter.cour || e.cour?.toString() === filter.cour)
          ).length;
          return (
            <div
              key={genre}
              className={`card text-center shadow-sm border filter-card ${isActive ? 'border-warning bg-warning-subtle' : 'border-0 bg-white'}`}
              style={{ cursor: 'pointer', width: '160px' }}
              onClick={() => handleFilterClick({ ...filter, genreConcours: genre, Specialiste: '' })}
            >
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">{genre}</h6>
                <span className="badge bg-warning text-dark">{count} élèves</span>
              </div>
            </div>
          );
        })}
        <div
          className="card text-center shadow-sm border bg-light filter-card"
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => handleFilterClick({ ...filter, genreConcours: '', Specialiste: '' })}
        >
          <div className="card-body p-3">
            <h6 className="fw-bold mb-1">Tout afficher</h6>
            <span className="badge bg-dark">{filteredEleves.length} élèves</span>
          </div>
        </div>
      </div>

      {/* ======= SPÉCIALISTE CONCOURS ======= */}
      {filter.genreConcours === 'specialiste' && (
        <>
          <h6 className="mt-4 fw-bold text-secondary">🧪 Choisir une spécialité de concours</h6>
          <div className="d-flex justify-content-center flex-wrap gap-3 mt-3">
            {specialiste.map((spec) => {
              const count = eleves.filter(e =>
                e.genreConcours === 'specialiste' &&
                e.Specialiste?.toLowerCase() === spec.toLowerCase() &&
                (!filter.cour || e.cour?.toString() === filter.cour)
              ).length;
              return (
                <div
                  key={spec}
                  className={`card text-center shadow-sm border filter-card ${filter.Specialiste === spec ? 'border-info bg-info-subtle' : 'border-0 bg-white'}`}
                  style={{ cursor: 'pointer', width: '160px' }}
                  onClick={() => handleFilterClick({ ...filter, Specialiste: spec })}
                >
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-1">{spec}</h6>
                    <span className="badge bg-info text-dark">{count} élèves</span>
                  </div>
                </div>
              );
            })}
            <div
              className="card text-center shadow-sm border bg-light filter-card"
              style={{ cursor: 'pointer', width: '160px' }}
              onClick={() => handleFilterClick({ ...filter, Specialiste: '' })}
            >
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">Tout afficher</h6>
                <span className="badge bg-dark">{filteredEleves.length} élèves</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======= FOKO ======= */}
      <h5 className="mt-5 fw-bold text-primary text-uppercase">🌍 Filtrer par Foko</h5>
      <div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
        {ethnies.map((foko) => {
          const isActive = filter.fady === foko;
          const count = eleves.filter(e =>
            e.fady?.toUpperCase() === foko &&
            (!filter.cour || e.cour?.toString() === filter.cour)
          ).length;
          return (
            <div
              key={foko}
              className={`card text-center shadow-sm filter-card ${isActive ? 'border border-info bg-info-subtle' : 'border-0 bg-white'}`}
              style={{ cursor: 'pointer', width: '160px' }}
              onClick={() => handleFilterClick({ ...filter, fady: foko })}
            >
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">{foko}</h6>
                <span className="badge bg-info text-dark">{count} élèves</span>
              </div>
            </div>
          );
        })}
        <div
          className={`card text-center shadow-sm filter-card ${filter.fady === 'AUTRES' ? 'border border-info bg-info-subtle' : 'bg-light'}`}
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => handleFilterClick({ ...filter, fady: 'AUTRES' })}
        >
          <div className="card-body p-3">
            <h6 className="fw-bold mb-1">AUTRES</h6>
            <span className="badge bg-info text-dark">
              {eleves.filter(e => !ethnies.includes(e.fady?.toUpperCase()) &&
                (!filter.cour || e.cour?.toString() === filter.cour)).length} élèves
            </span>
          </div>
        </div>
        <div
          className="card text-center shadow-sm bg-light filter-card"
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => handleFilterClick({ ...filter, fady: '' })}
        >
          <div className="card-body p-3">
            <h6 className="fw-bold mb-1">Tout afficher</h6>
            <span className="badge bg-dark">{filteredEleves.length} élèves</span>
          </div>
        </div>
      </div>

      <style>{`
        .filter-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 15px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* ======= POINTURE ======= */}
      <h5 className="mt-5 fw-bold text-primary text-uppercase">👟 Pointure</h5>
      <DataTable
        columns={columns2}
        data={filteredPointures}
        pagination
        highlightOnHover
        responsive
        striped
        noDataComponent="Aucune pointure trouvée"
        customStyles={{
          headRow: { style: { backgroundColor: '#0d6efd' } },
          headCells: { style: { fontWeight: 'bold', fontSize: '14px' } },
          rows: { style: { fontSize: '14px' } },
          table: { style: { border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' } },
        }}
      />
      <div className="d-flex justify-content-end mt-4 gap-2">
        <button onClick={exportExcel} className="btn btn-success">📊 Export Excel</button>
        <button onClick={exportPDF} className="btn btn-primary">📄 Export PDF</button>
      </div>

      {/* ======= MODAL DÉTAIL ÉLÈVE ======= */}
      {showDetailModal && selectedEleve && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '14px',
              width: '92vw', maxWidth: '1000px',
              maxHeight: '90vh', overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4"
              style={{ borderBottom: '3px solid #0d6efd', paddingBottom: '14px' }}>
              <div className="d-flex align-items-center gap-3">
                {selectedEleve.image ? (
                  <img src={selectedEleve.image} alt="photo"
                    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #0d6efd' }} />
                ) : (
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    backgroundColor: '#0d6efd', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem', color: 'white', fontWeight: 'bold'
                  }}>
                    {selectedEleve.nom?.[0]}{selectedEleve.prenom?.[0]}
                  </div>
                )}
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{selectedEleve.nom} {selectedEleve.prenom}</h4>
                  <small className="text-muted">
                    Escadron {selectedEleve.escadron} · Peloton {selectedEleve.peloton} · Inc. {selectedEleve.numeroIncorporation}
                  </small>
                  <div className="mt-1">
                    <span className="badge bg-primary me-1">{selectedEleve.genreConcours}</span>
                    {selectedEleve.Specialiste && <span className="badge bg-info text-dark me-1">{selectedEleve.Specialiste}</span>}
                    {selectedEleve.sexe && <span className="badge bg-secondary">{selectedEleve.sexe}</span>}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowDetailModal(false)}
              >✕ Fermer</button>
            </div>

            <div className="row g-3">
              {/* Infos personnelles */}
              <div className="col-md-6">
                <div className="card border-0 h-100 p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="fw-bold text-primary mb-3">👤 Informations personnelles</h6>
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      {[
                        ['CIN', selectedEleve.CIN],
                        ['Date naissance', selectedEleve.dateNaissance],
                        ['Lieu naissance', selectedEleve.lieuNaissance],
                        ['Sexe', selectedEleve.sexe],
                        ['Situation familiale', selectedEleve.situationFamiliale],
                        ['Religion', selectedEleve.religion],
                        ['Groupe sanguin', selectedEleve.groupeSaguin],
                        ['Foko', selectedEleve.fady],
                        ['Téléphone 1', selectedEleve.telephone1],
                        ['Téléphone 2', selectedEleve.telephone2],
                        ['Téléphone 3', selectedEleve.telephone3],
                        ['Loisirs', selectedEleve.facebook],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <tr key={label}>
                          <td className="text-muted" style={{ width: '45%', fontSize: '0.82rem' }}>{label}</td>
                          <td className="fw-semibold" style={{ fontSize: '0.82rem' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Infos militaires */}
              <div className="col-md-6">
                <div className="card border-0 h-100 p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="fw-bold text-primary mb-3">🎖️ Informations militaires</h6>
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      {[
                        ['Matricule', selectedEleve.matricule],
                        ['N° Incorporation', selectedEleve.numeroIncorporation],
                        ['N° Candidature', selectedEleve.numCandidature],
                        ['Centre concours', selectedEleve.centreConcours],
                        ['Genre concours', selectedEleve.genreConcours],
                        ['Spécialiste concours', selectedEleve.Specialiste],
                        ['Escadron', selectedEleve.escadron],
                        ['Peloton', selectedEleve.peloton],
                        ['Cours', selectedEleve.cour],
                        ['Relation gênante', selectedEleve.relationGenante],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <tr key={label}>
                          <td className="text-muted" style={{ width: '45%', fontSize: '0.82rem' }}>{label}</td>
                          <td className="fw-semibold" style={{ fontSize: '0.82rem' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spécialités */}
              <div className="col-12">
                <div className="card border-0 p-3" style={{ backgroundColor: '#eef5ff' }}>
                  <h6 className="fw-bold text-primary mb-3">🎓 Spécialité(s) / Aptitude(s)</h6>

                  {selectedEleve.SpecialisteAptitude && (
                    <div className="mb-2 p-2 rounded d-flex align-items-center gap-2"
                      style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c040' }}>
                      <small className="text-muted">Ancienne donnée :</small>
                      <span className="badge bg-secondary">{selectedEleve.SpecialisteAptitude}</span>
                    </div>
                  )}

                  {selectedEleve.specialites && selectedEleve.specialites.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {selectedEleve.specialites.map((sp, i) => (
                        <div key={i} className="card border-0 shadow-sm p-2"
                          style={{ minWidth: '180px', backgroundColor: '#fff' }}>
                          <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                            🎯 {sp.categorie}
                          </div>
                          {sp.detail && (
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                              📌 {sp.detail}
                            </div>
                          )}
                          {sp.niveauQualification && (
                            <span className={`badge mt-1 ${
                              sp.niveauQualification === 'Licencié' ? 'bg-success' :
                              sp.niveauQualification === 'En cours de licence' ? 'bg-warning text-dark' :
                              'bg-info text-dark'
                            }`} style={{ fontSize: '0.72rem' }}>
                              {sp.niveauQualification}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : !selectedEleve.SpecialisteAptitude && (
                    <span className="text-muted fst-italic">Aucune spécialité renseignée</span>
                  )}
                </div>
              </div>

              {/* Formation */}
              <div className="col-md-6">
                <div className="card border-0 p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="fw-bold text-primary mb-3">📚 Formation</h6>
                  <table className="table table-sm table-borderless mb-2">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ fontSize: '0.82rem' }}>Niveau</td>
                        <td className="fw-semibold" style={{ fontSize: '0.82rem' }}>{selectedEleve.niveau || '—'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted" style={{ fontSize: '0.82rem' }}>Filière</td>
                        <td className="fw-semibold" style={{ fontSize: '0.82rem' }}>{selectedEleve.niveaufiliere || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {selectedEleve.Diplome && (
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(selectedEleve.Diplome)
                        .filter(([k, v]) => v === true && !['id', 'eleveId', 'createdAt', 'updatedAt'].includes(k))
                        .map(([k]) => (
                          <span key={k} className="badge bg-success" style={{ fontSize: '0.72rem' }}>{k}</span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sports */}
              <div className="col-md-6">
                <div className="card border-0 p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="fw-bold text-primary mb-3">⚽ Sports pratiqués</h6>
                  {selectedEleve.Sport ? (
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(selectedEleve.Sport)
                        .filter(([k, v]) => v === true && !['id', 'eleveId', 'createdAt', 'updatedAt'].includes(k))
                        .map(([k]) => (
                          <span key={k} className="badge bg-primary" style={{ fontSize: '0.75rem' }}>{k}</span>
                        ))}
                    </div>
                  ) : <span className="text-muted fst-italic">Non renseigné</span>}
                </div>
              </div>

              {/* Pointure */}
              {selectedEleve.Pointure && (
                <div className="col-12">
                  <div className="card border-0 p-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="fw-bold text-primary mb-3">👕 Pointure effets</h6>
                    <div className="d-flex flex-wrap gap-3">
                      {[
                        ['👔 Chemise', selectedEleve.Pointure.tailleChemise],
                        ['🎩 Tour de tête', selectedEleve.Pointure.tourTete ? selectedEleve.Pointure.tourTete + ' cm' : null],
                        ['👖 Pantalon', selectedEleve.Pointure.pointurePantalon],
                        ['👟 Chaussure', selectedEleve.Pointure.pointureChaussure],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="text-center p-3 bg-white rounded shadow-sm" style={{ minWidth: '110px' }}>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{label}</div>
                          <div className="fw-bold text-primary fs-5">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DiverPage;
