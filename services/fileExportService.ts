// Declara as variáveis globais que são injetadas pelos scripts CDN no index.html
declare const jspdf: any;
declare const docx: any;

/**
 * Inicia o download de um arquivo de texto.
 * @param content O conteúdo do arquivo.
 * @param fileName O nome do arquivo a ser salvo.
 */
export const exportAsTxt = (content: string, fileName: string = 'manifestacao.txt') => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Gera um arquivo .docx a partir do texto e inicia o download.
 * @param content O conteúdo do arquivo.
 * @param fileName O nome do arquivo a ser salvo.
 */
export const exportAsDocx = (content: string, fileName: string = 'manifestacao.docx') => {
  const { Document, Packer, Paragraph, TextRun } = docx;

  const doc = new Document({
    sections: [{
      children: content.split('\n').map(text => 
        new Paragraph({
          children: [new TextRun(text)],
        })
      ),
    }],
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};

/**
 * Gera um arquivo .pdf a partir do texto e inicia o download.
 * @param content O conteúdo do arquivo.
 * @param fileName O nome do arquivo a ser salvo.
 */
export const exportAsPdf = (content: string, fileName: string = 'manifestacao.pdf') => {
  const { jsPDF } = jspdf;
  // eslint-disable-next-line new-cap
  const doc = new jsPDF();
  
  // Define a largura máxima do texto, margens e posição inicial
  const margin = 15;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  
  // Divide o texto em linhas que cabem na largura da página
  const lines = doc.splitTextToSize(content, maxWidth);
  
  // Adiciona o texto ao documento
  doc.text(lines, margin, margin + 10); // Adiciona 10 para um respiro no topo
  
  doc.save(fileName);
};