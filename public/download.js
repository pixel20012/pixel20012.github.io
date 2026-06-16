// OPL Download Handler
// Components: OPL, OPL-NAI, TUA
// Assembled Builds: OPL+TUA, OPL-NAI+TUA

async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    return res.text();
}

// Component download — raw .md file
async function downloadOPLMarkdown(version, isNAI = false) {
    const filename = isNAI
        ? `OPL-v${version}-nai.md`
        : `OPL-v${version}.md`;

    const text = await fetchText(`/downloads/opl/${filename}`);
    triggerDownload(text, filename, 'text/markdown');
}

// Assembled build download — OPL + TUA as PDF
async function downloadOPLBundle(version, isNAI = false) {
    const oplFilename = isNAI
        ? `OPL-v${version}-NAI.md`
        : `OPL-v${version}.md`;

    const pdfFilename = isNAI
        ? `OPL-v${version}-NAI+TUA.pdf`
        : `OPL-v${version}+TUA.pdf`;

    const [oplText, tuaText] = await Promise.all([
        fetchText(`/downloads/opl/${oplFilename}`),
        fetchText('/downloads/TUA.md')
    ]);

    // Assemble the build
    const assembled = [
        oplText.trim(),
        '',
        '---',
        '',
        'Start of TUA',
        '',
        tuaText.trim()
    ].join('\n');

    generatePDF(assembled, pdfFilename, version, isNAI);
}

function generatePDF(content, filename, version, isNAI) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    const margin = 72;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 13;
    let y = margin;

    // Title block
    doc.setFont('arial', 'bold');
    doc.setFontSize(14);
    const title = isNAI
        ? `Open Pixel License v${version} — No-AI Variant`
        : `Open Pixel License v${version}`;
    doc.text(title, margin, y);
    y += lineHeight * 2;

    if (isNAI) {
        doc.setFontSize(10);
        doc.text('[ NO-AI VARIANT — AI USE PROHIBITED ]', margin, y);
        y += lineHeight * 2;
    }

    // Body
    doc.setFont('Courier', 'normal');
    doc.setFontSize(9.5);

    const plain = markdownToPlain(content);
    const lines = plain.split('\n');

    lines.forEach(line => {
        const wrapped = doc.splitTextToSize(line || ' ', pageWidth);
        wrapped.forEach(wline => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            // Style headers
            if (line.startsWith('## ')) {
                doc.setFont('Courier', 'bold');
                doc.setFontSize(10);
            } else if (line.startsWith('# ')) {
                doc.setFont('Courier', 'bold');
                doc.setFontSize(11);
            } else if (line === '---' || line.startsWith('─')) {
                doc.setFont('Courier', 'normal');
                doc.setFontSize(9.5);
            } else {
                doc.setFont('Courier', 'normal');
                doc.setFontSize(9.5);
            }
            doc.text(wline, margin, y);
            y += lineHeight;
        });
        // Extra space after headers and separators
        if (line.startsWith('#') || line === '---') {
            y += lineHeight * 0.5;
        }
    });

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('Arial', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
            `Open Pixel License v${version} — pixel20012.github.io/opl/ — Page ${i} of ${pageCount}`,
            margin,
            pageHeight - 36
        );
        doc.setTextColor(0);
    }

    doc.save(filename);
}

function markdownToPlain(md) {
    return md
        .replace(/^### (.+)$/gm, '### $1')
        .replace(/^## (.+)$/gm, '## $1')
        .replace(/^# (.+)$/gm, '# $1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^- \[x\] /gim, '[X] ')
        .replace(/^- \[ \] /gim, '[ ] ')
        .replace(/^[-*]\s+/gm, '  • ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^> /gm, '    ')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/^---$/gm, '─'.repeat(72))
        .replace(/^Start of TUA$/gm, '\nStart of TUA\n')
        .trim();
}

function triggerDownload(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}