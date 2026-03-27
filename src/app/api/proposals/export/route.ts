import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  PageBreak,
  BorderStyle,
} from "docx";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/proposals/export?id=<proposalId>
 * Generates a .docx file from a saved proposal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("id");

  if (!proposalId) {
    return NextResponse.json({ error: "id parameter required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Fetch proposal with related data
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*, grants(title, funder, deadline, max_amount_eur, country), projects(name, summary), organizations(name, mission)")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const content = proposal.content as {
    sections?: { title: string; content: string }[];
    language?: string;
    generatedAt?: string;
  };

  const sections = content?.sections || [];
  const grantTitle = proposal.grants?.title || "Subvention";
  const funder = proposal.grants?.funder || "";
  const orgName = proposal.organizations?.name || "";
  const projectName = proposal.projects?.name || "";
  const deadline = proposal.grants?.deadline
    ? new Date(proposal.grants.deadline).toLocaleDateString("fr-FR")
    : null;
  const generatedAt = content?.generatedAt
    ? new Date(content.generatedAt).toLocaleDateString("fr-FR")
    : new Date(proposal.created_at).toLocaleDateString("fr-FR");

  // Build document
  const children: Paragraph[] = [];

  // ── Cover info ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "PROPOSITION DE SUBVENTION", bold: true, size: 36, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: grantTitle, bold: true, size: 28, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: funder ? `Bailleur : ${funder}` : "", size: 22, font: "Calibri", color: "666666" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
  );

  if (orgName) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Soumis par : ${orgName}`, size: 22, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  if (projectName) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Projet : ${projectName}`, size: 22, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  if (deadline) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Deadline : ${deadline}`, size: 20, font: "Calibri", color: "CC0000", bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Généré le ${generatedAt} via Emile`, size: 18, font: "Calibri", color: "999999", italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "1a1a1a" } },
      spacing: { after: 400 },
    }),
  );

  // ── Sections ──
  for (const section of sections) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
    );

    // Split content into paragraphs
    const paragraphs = section.content.split("\n").filter((line) => line.trim());
    for (const para of paragraphs) {
      const trimmed = para.trim();

      // Bullet points
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed)) {
        const text = trimmed.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "");
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${text}`, size: 22, font: "Calibri" })],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
        );
      }
      // [À COMPLÉTER] markers
      else if (trimmed.includes("[À COMPLÉTER")) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                size: 22,
                font: "Calibri",
                color: "CC6600",
                italics: true,
                highlight: "yellow",
              }),
            ],
            spacing: { after: 100 },
          }),
        );
      }
      // Regular paragraph
      else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, size: 22, font: "Calibri" })],
            spacing: { after: 100 },
          }),
        );
      }
    }
  }

  // ── Footer ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Ce document est un premier brouillon généré par Emile (emile.fr). Il doit être relu, complété et adapté avant soumission.",
          size: 18,
          font: "Calibri",
          color: "999999",
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  const doc = new Document({
    creator: "Emile — Le copilote financement des ONG",
    title: `Proposition — ${grantTitle}`,
    description: `Brouillon de proposition pour ${grantTitle} (${funder})`,
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  const filename = `Proposition_${orgName.replace(/\s+/g, "_").slice(0, 30)}_${grantTitle.replace(/\s+/g, "_").slice(0, 40)}.docx`;

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
