import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  PageBreak,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";

/**
 * GET /api/proposals/export?id=<proposalId>
 * Generates a professional .docx file adapted to the grant + project logframe
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("id");

  if (!proposalId) {
    return NextResponse.json({ error: "id parameter required" }, { status: 400 });
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch proposal with all related data including project logframe
  const { data: proposal, error } = await supabaseAdmin
    .from("proposals")
    .select(`
      *,
      grants(title, funder, deadline, max_amount_eur, country, thematic_areas, eligible_entities, co_financing_required, summary),
      projects(name, summary, objectives, target_beneficiaries, target_geography, requested_amount_eur, duration_months, indicators, logframe_data),
      organizations(name, mission, country, thematic_areas, prior_grants)
    `)
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Verify user owns this proposal
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, user_id")
    .eq("id", proposal.organization_id)
    .single();

  if (!org || org.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const content = proposal.content as {
    sections?: { title: string; content: string }[];
    language?: string;
    generatedAt?: string;
  };

  const sections = content?.sections || [];
  const grant = proposal.grants || {};
  const project = proposal.projects || {};
  const organization = proposal.organizations || {};
  const logframe = project.logframe_data as Record<string, unknown> | null;

  const grantTitle = grant.title || "Subvention";
  const funder = grant.funder || "";
  const orgName = organization.name || "";
  const projectName = project.name || "";
  const deadline = grant.deadline
    ? new Date(grant.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const generatedAt = content?.generatedAt
    ? new Date(content.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : new Date(proposal.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // ═══════════════════════════════════════════
  // BUILD DOCUMENT
  // ═══════════════════════════════════════════

  const FONT = "Calibri";
  const COLOR_PRIMARY = "1a1a1a";
  const COLOR_ACCENT = "2E7D32";
  const COLOR_MUTED = "666666";
  const COLOR_PLACEHOLDER = "CC6600";

  // ── Cover Page ──
  const coverChildren: (Paragraph | Table)[] = [];

  // Spacer
  coverChildren.push(new Paragraph({ spacing: { after: 600 } }));

  // Title block
  coverChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "PROPOSITION DE SUBVENTION", bold: true, size: 40, font: FONT, color: COLOR_PRIMARY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_ACCENT } },
      spacing: { after: 300 },
    }),
  );

  // Grant title
  coverChildren.push(
    new Paragraph({
      children: [new TextRun({ text: grantTitle, bold: true, size: 32, font: FONT, color: COLOR_PRIMARY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Funder
  if (funder) {
    coverChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `Appel à propositions — ${funder}`, size: 24, font: FONT, color: COLOR_MUTED })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );
  }

  // Info table
  const infoRows: [string, string][] = [];
  if (orgName) infoRows.push(["Organisation", orgName]);
  if (projectName) infoRows.push(["Projet", projectName]);
  if (project.requested_amount_eur) {
    infoRows.push(["Montant demandé", `${Number(project.requested_amount_eur).toLocaleString("fr-FR")} €`]);
  }
  if (project.duration_months) {
    infoRows.push(["Durée", `${project.duration_months} mois`]);
  }
  if (deadline) infoRows.push(["Date limite", deadline]);
  if (grant.country) infoRows.push(["Pays", grant.country === "FR" ? "France" : grant.country]);

  if (infoRows.length > 0) {
    coverChildren.push(
      new Table({
        rows: infoRows.map(
          ([label, value]) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 3000, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: label, bold: true, size: 20, font: FONT, color: COLOR_MUTED })],
                      spacing: { before: 40, after: 40 },
                    }),
                  ],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                }),
                new TableCell({
                  width: { size: 6000, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: value, size: 22, font: FONT })],
                      spacing: { before: 40, after: 40 },
                    }),
                  ],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                }),
              ],
            })
        ),
        width: { size: 9000, type: WidthType.DXA },
      }),
    );
  }

  coverChildren.push(
    new Paragraph({ spacing: { after: 600 } }),
    new Paragraph({
      children: [new TextRun({ text: `Document généré le ${generatedAt}`, size: 18, font: FONT, color: COLOR_MUTED, italics: true })],
      alignment: AlignmentType.CENTER,
    }),
  );

  // ── Content Pages ──
  const contentChildren: (Paragraph | Table)[] = [];

  // Table of contents header
  contentChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "TABLE DES MATIÈRES", bold: true, size: 28, font: FONT })],
      spacing: { after: 200 },
    }),
  );

  for (let i = 0; i < sections.length; i++) {
    contentChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 22, font: FONT }),
          new TextRun({ text: sections[i].title, size: 22, font: FONT }),
        ],
        spacing: { after: 60 },
        indent: { left: 200 },
      }),
    );
  }

  contentChildren.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_ACCENT } },
      spacing: { before: 200, after: 400 },
    }),
  );

  // ── Proposal Sections ──
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Section heading
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${section.title}`, bold: true, size: 28, font: FONT, color: COLOR_PRIMARY })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 150 },
      }),
    );

    // Check if this is a logframe section — render as table
    const isLogframe = section.title.toLowerCase().includes("cadre logique") || section.title.toLowerCase().includes("logframe");

    if (isLogframe && logframe) {
      // Render logframe as a proper table
      renderLogframeTable(contentChildren, logframe, FONT, COLOR_ACCENT);
      // Also render any additional text content
      const textContent = section.content
        .split("\n")
        .filter((line) => line.trim() && !line.includes("→") && !line.startsWith("Objectif"));
      for (const line of textContent) {
        contentChildren.push(
          new Paragraph({
            children: [new TextRun({ text: line.trim(), size: 22, font: FONT })],
            spacing: { after: 80 },
          }),
        );
      }
    } else {
      // Standard section rendering
      renderSectionContent(contentChildren, section.content, FONT, COLOR_PLACEHOLDER);
    }
  }

  // ── Logframe Annex (if logframe data exists but no logframe section) ──
  const hasLogframeSection = sections.some(
    (s) => s.title.toLowerCase().includes("cadre logique") || s.title.toLowerCase().includes("logframe")
  );

  if (logframe && !hasLogframeSection) {
    contentChildren.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        children: [new TextRun({ text: "ANNEXE — Cadre Logique", bold: true, size: 28, font: FONT, color: COLOR_PRIMARY })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
      }),
    );
    renderLogframeTable(contentChildren, logframe, FONT, COLOR_ACCENT);
  }

  // ── Footer page ──
  contentChildren.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_ACCENT } },
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "AVERTISSEMENT",
          bold: true,
          size: 20,
          font: FONT,
          color: COLOR_MUTED,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Ce document est un premier brouillon généré par Emile. Il doit être relu, complété et adapté avant soumission au bailleur. ",
          size: 18,
          font: FONT,
          color: COLOR_MUTED,
          italics: true,
        }),
        new TextRun({
          text: "Les passages surlignés en orange marqués [À COMPLÉTER] nécessitent votre attention.",
          size: 18,
          font: FONT,
          color: COLOR_PLACEHOLDER,
          italics: true,
        }),
      ],
    }),
  );

  // ── Assemble Document ──
  const doc = new Document({
    creator: "Emile — Le copilote financement des ONG",
    title: `Proposition — ${grantTitle}`,
    description: `Proposition pour ${grantTitle} (${funder}) — ${orgName}`,
    sections: [
      {
        children: coverChildren,
        properties: {
          page: {
            pageNumbers: { start: 1 },
          },
        },
      },
      {
        children: contentChildren,
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${orgName} — ${projectName}`, size: 16, font: FONT, color: COLOR_MUTED, italics: true }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Page ", size: 16, font: FONT, color: COLOR_MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT, color: COLOR_MUTED }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  const safeName = (s: string) => s.replace(/[^a-zA-Z0-9àâéèêëïîôùûüÿçÀÂÉÈÊËÏÎÔÙÛÜŸÇ\s-]/g, "").replace(/\s+/g, "_").slice(0, 40);
  const filename = `Proposition_${safeName(orgName)}_${safeName(grantTitle)}.docx`;

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function renderSectionContent(
  children: (Paragraph | Table)[],
  content: string,
  font: string,
  placeholderColor: string,
) {
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Sub-heading (bold line ending with :)
    if (trimmed.endsWith(":") && trimmed.length < 80 && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, bold: true, size: 22, font })],
          spacing: { before: 160, after: 60 },
        }),
      );
    }
    // Indented sub-items (→)
    else if (trimmed.startsWith("→") || trimmed.startsWith("  →")) {
      const text = trimmed.replace(/^→\s*/, "");
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `  → ${text}`, size: 20, font, color: "444444" })],
          spacing: { after: 40 },
          indent: { left: 720 },
        }),
      );
    }
    // Bullet points
    else if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+[\.\)]\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-•]\s*/, "").replace(/^\d+[\.\)]\s*/, "");
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${text}`, size: 22, font })],
          spacing: { after: 60 },
          indent: { left: 360 },
        }),
      );
    }
    // [À COMPLÉTER] markers
    else if (trimmed.includes("[À COMPLÉTER")) {
      // Split around placeholders to highlight only the marker
      const parts = trimmed.split(/(\[À COMPLÉTER[^\]]*\])/g);
      const runs: TextRun[] = parts.map((part) => {
        if (part.match(/^\[À COMPLÉTER/)) {
          return new TextRun({ text: part, size: 22, font, color: placeholderColor, italics: true, highlight: "yellow" });
        }
        return new TextRun({ text: part, size: 22, font });
      });
      children.push(
        new Paragraph({ children: runs, spacing: { after: 100 } }),
      );
    }
    // Regular paragraph
    else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22, font })],
          spacing: { after: 100 },
        }),
      );
    }
  }
}

function renderLogframeTable(
  children: (Paragraph | Table)[],
  logframe: Record<string, unknown>,
  font: string,
  accentColor: string,
) {
  const objectives = (logframe.specific_objectives as string[] || []).filter(Boolean);
  const activities = (logframe.activities as string[] || []).filter(Boolean);
  const results = (logframe.expected_results as { result?: string; indicator?: string }[] || []);
  const generalObj = (logframe.general_objective as string) || "[À COMPLÉTER]";

  // Header row
  const headerCells = ["Niveau", "Description", "Indicateurs", "Sources de vérification"].map(
    (text) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, size: 18, font, color: "FFFFFF" })],
            spacing: { before: 40, after: 40 },
          }),
        ],
        shading: { type: ShadingType.SOLID, color: accentColor },
      })
  );

  const rows: TableRow[] = [new TableRow({ children: headerCells })];

  // General objective row
  rows.push(
    makeLogframeRow("Objectif général", generalObj, "[À COMPLÉTER]", "[À COMPLÉTER]", font),
  );

  // Specific objectives + results + activities
  const maxRows = Math.max(objectives.length, results.length, activities.length, 1);
  for (let i = 0; i < maxRows; i++) {
    if (objectives[i]) {
      rows.push(
        makeLogframeRow(
          `Objectif spécifique ${i + 1}`,
          objectives[i],
          results[i]?.indicator || "[À COMPLÉTER]",
          "[À COMPLÉTER]",
          font,
        ),
      );
    }
    if (results[i]?.result) {
      rows.push(
        makeLogframeRow(
          `Résultat ${i + 1}`,
          results[i].result!,
          results[i].indicator || "[À COMPLÉTER]",
          "[À COMPLÉTER]",
          font,
        ),
      );
    }
    if (activities[i]) {
      rows.push(
        makeLogframeRow(`Activité ${i + 1}`, activities[i], "[À COMPLÉTER]", "[À COMPLÉTER]", font),
      );
    }
  }

  children.push(
    new Table({
      rows,
      width: { size: 9500, type: WidthType.DXA },
    }),
  );

  // Add logframe metadata below table
  const meta: [string, string][] = [];
  if (logframe.methodology) meta.push(["Méthodologie", logframe.methodology as string]);
  if (logframe.partners) meta.push(["Partenaires", logframe.partners as string]);
  if (logframe.sustainability) meta.push(["Durabilité", logframe.sustainability as string]);

  for (const [label, value] of meta) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label} : `, bold: true, size: 20, font }),
          new TextRun({ text: value, size: 20, font }),
        ],
        spacing: { before: 80, after: 60 },
      }),
    );
  }
}

function makeLogframeRow(
  level: string,
  description: string,
  indicator: string,
  source: string,
  font: string,
): TableRow {
  const isPlaceholder = (text: string) => text.includes("[À COMPLÉTER");
  const makeCell = (text: string, bold = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 18,
              font,
              bold,
              color: isPlaceholder(text) ? "CC6600" : undefined,
              italics: isPlaceholder(text),
            }),
          ],
          spacing: { before: 30, after: 30 },
        }),
      ],
    });

  return new TableRow({
    children: [
      makeCell(level, true),
      makeCell(description),
      makeCell(indicator),
      makeCell(source),
    ],
  });
}
