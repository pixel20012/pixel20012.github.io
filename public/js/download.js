// =========================
// OPL Download Handler
// =========================

// Fetch helper
async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    return res.text();
}

// =========================
// COMPONENT DOWNLOAD (PDF)
// =========================
async function downloadOPLMarkdown(version, isNAI = false) {
    const mdFilename = isNAI
        ? `v${version}-NAI.md`
        : `v${version}.md`;

    const pdfFilename = isNAI
        ? `v${version}-NAI.pdf`
        : `v${version}.pdf`;

    const text = await fetchText(`/downloads/opl/${mdFilename}`);

    generatePDF(text, pdfFilename, version, isNAI);
}

// =========================
// ASSEMBLED DOWNLOAD (MD)
// =========================
async function downloadOPLBundle(version, isNAI = false) {
    const oplFilename = isNAI
        ? `v${version}-NAI.md`
        : `v${version}.md`;

    const mdFilename = isNAI
        ? `v${version}-NAI+TUA.md`
        : `v${version}+TUA.md`;

    const [oplText, tuaText] = await Promise.all([
        fetchText(`/downloads/opl/${oplFilename}`),
        fetchText('/downloads/TUA.md')
    ]);

    const assembled = [
        oplText.trim(),
        '',
        '---',
        '',
        'Start of TUA',
        '',
        tuaText.trim()
    ].join('\n');

    triggerDownload(
        assembled,
        mdFilename,
        'text/markdown'
    );
}

// =========================
// PDF GENERATOR
// =========================
function generatePDF(content, filename, version, isNAI) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    const margin = 72;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 13;
    let y = margin;

    // Title
    doc.setFont('Courier', 'bold');
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

            if (line.startsWith('# ')) {
                doc.setFont('Courier', 'bold');
                doc.setFontSize(11);
            } else if (line.startsWith('## ')) {
                doc.setFont('Courier', 'bold');
                doc.setFontSize(10);
            } else {
                doc.setFont('Courier', 'normal');
                doc.setFontSize(9.5);
            }

            doc.text(wline, margin, y);
            y += lineHeight;
        });

        if (line.startsWith('#') || line === '---') {
            y += lineHeight * 0.5;
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('Courier', 'normal');
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

// =========================
// MARKDOWN CLEANER
// =========================
function markdownToPlain(md) {
    return md
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^[-*]\s+/gm, '  • ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^> /gm, '    ')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/^---$/gm, '─'.repeat(72))
        .trim();
}

// =========================
// DOWNLOAD TRIGGER
// =========================
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
