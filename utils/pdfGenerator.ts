import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface SummaryResult {
  id: string
  fileName: string
  fileType: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  createdAt: string
  status: 'processing' | 'completed' | 'failed'
}

export const generatePDF = async (result: SummaryResult): Promise<void> => {
  // Create a temporary div to render the content
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  tempDiv.style.top = '0'
  tempDiv.style.width = '800px'
  tempDiv.style.padding = '40px'
  tempDiv.style.backgroundColor = 'white'
  tempDiv.style.fontFamily = 'Arial, sans-serif'
  tempDiv.style.fontSize = '14px'
  tempDiv.style.lineHeight = '1.6'
  tempDiv.style.color = '#333'

  tempDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">AutoBrief.AI</h1>
      <h2 style="color: #374151; font-size: 24px; margin-bottom: 5px;">Summary Report</h2>
      <p style="color: #6b7280; font-size: 16px;">${result.fileName}</p>
      <p style="color: #9ca3af; font-size: 14px;">Generated on ${new Date(result.createdAt).toLocaleDateString()}</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #2563eb; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
        Executive Summary
      </h3>
      <p style="text-align: justify; margin-bottom: 20px;">
        ${result.summary}
      </p>
    </div>

    <div style="display: flex; gap: 30px; margin-bottom: 30px;">
      <div style="flex: 1;">
        <h3 style="color: #2563eb; font-size: 18px; margin-bottom: 15px;">Key Points</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${result.keyPoints.map(point => `<li style="margin-bottom: 8px;">${point}</li>`).join('')}
        </ul>
      </div>
      
      <div style="flex: 1;">
        <h3 style="color: #059669; font-size: 18px; margin-bottom: 15px;">Action Items</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${result.actionItems.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p>Powered by AutoBrief.AI - AI-Powered Meeting & Document Summarization</p>
      <p>File Type: ${result.fileType.toUpperCase()} | Processed on ${new Date(result.createdAt).toLocaleString()}</p>
    </div>
  `

  document.body.appendChild(tempDiv)

  try {
    // Convert the div to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Download the PDF
    const fileName = `autobrief-summary-${result.fileName.replace(/\.[^/.]+$/, '')}-${Date.now()}.pdf`
    pdf.save(fileName)

  } finally {
    // Clean up
    document.body.removeChild(tempDiv)
  }
} 