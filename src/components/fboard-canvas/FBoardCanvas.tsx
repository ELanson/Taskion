import React, { useState, useRef } from 'react';
import { BoardConfig, Unit, BatchItem, LogoData } from './types';
import { BoardPreview } from './components/BoardPreview';
import { ColorPicker } from './components/ColorPicker';
import { TilingModal } from './components/TilingModal';
import { TiledPreview } from './components/TiledPreview';
import { Download, FileUp, Settings, Layers, Type, Palette, Plus, Trash2, Link, Unlink, AlignLeft, AlignCenter, AlignRight, AlignVerticalSpaceAround, AlignVerticalSpaceBetween, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, LayoutTemplate, Image as ImageIcon, Grid2X2, Monitor } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF, GState } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import UTIF from 'utif';
import { unitToPx, pxToUnit } from './utils';
import logo from './assets/logo.svg';
import logoInvert from './assets/logo-invert.svg';
import { useAppStore } from '../../store/useAppStore';
import { ArrowLeft } from 'lucide-react';

const DEFAULT_CONFIG: BoardConfig = {
  width: 300,
  height: 25,
  unit: 'cm',
  bleed: 0,
  marginTop: 2.5,
  marginRight: 5,
  marginBottom: 2.5,
  marginLeft: 5,
  marginLinked: false,
  text: 'COMPANY NAME',
  fontSize: 260,
  fontFamily: "'Montserrat', sans-serif",
  fontWeight: 600,
  backgroundColor: '#ffffff',
  textColor: '#000000',
  showGuides: true,
  layout: 'text-only',
  textAlign: 'center',
  verticalAlign: 'center',
  logoSize: 5,
};

export function FBoardCanvas() {
  const { setActiveTab, isAdmin } = useAppStore();
  const [setupMode, setSetupMode] = useState(true);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [config, setConfig] = useState<BoardConfig>(DEFAULT_CONFIG);
  const [batchData, setBatchData] = useState<BatchItem[]>([]);
  const [selectedBatchIndices, setSelectedBatchIndices] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTilingModal, setShowTilingModal] = useState(false);
  const [showTilingView, setShowTilingView] = useState(false);
  const [showVectorStudio, setShowVectorStudio] = useState(false);
  const [showStudioLock, setShowStudioLock] = useState(false);
  const [tilingViewWidth, setTilingViewWidth] = useState<120 | 150>(150);
  const [productionName, setProductionName] = useState('New Production');
  const svgRef = useRef<SVGSVGElement>(null);

  const handleConfigChange = (key: keyof BoardConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    
    // Update selected batch items if any
    if (selectedBatchIndices.length > 0) {
      setBatchData(prev => prev.map((item, idx) =>
        selectedBatchIndices.includes(idx) ? { ...item, [key]: value } : item
      ));
    }
  };

  const handleMarginChange = (field: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: number) => {
    if (config.marginLinked) {
      setConfig((prev) => ({
        ...prev,
        marginTop: value,
        marginRight: value,
        marginBottom: value,
        marginLeft: value,
      }));
      if (selectedBatchIndices.length > 0) {
        setBatchData(prev => prev.map((item, idx) =>
          selectedBatchIndices.includes(idx) ? {
            ...item,
            marginTop: value,
            marginRight: value,
            marginBottom: value,
            marginLeft: value,
          } : item
        ));
      }
    } else {
      setConfig((prev) => ({ ...prev, [field]: value }));
      if (selectedBatchIndices.length > 0) {
        setBatchData(prev => prev.map((item, idx) =>
          selectedBatchIndices.includes(idx) ? { ...item, [field]: value } : item
        ));
      }
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedBatchIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAllSelection = () => {
    if (selectedBatchIndices.length === batchData.length) {
      setSelectedBatchIndices([]);
    } else {
      setSelectedBatchIndices(batchData.map((_, i) => i));
    }
  };

  const handleAddBatchItem = () => {
    setBatchData([...batchData, {
      ...config,
      companyName: 'NEW COMPANY',
      text: 'NEW COMPANY',
      copies: 1
    }]);
  };

  const handleUpdateBatchItem = (index: number, field: keyof BatchItem, value: any) => {
    const newData = [...batchData];
    newData[index] = { ...newData[index], [field]: value };
    if (field === 'companyName') {
      newData[index].text = value; // Keep text in sync with company name for batch
    }
    setBatchData(newData);
  };

  const handleRemoveBatchItem = (index: number) => {
    setBatchData(batchData.filter((_, i) => i !== index));
    setSelectedBatchIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const handleLogoUpload = (side: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const logoData: LogoData = {
            url: pngUrl,
            width: img.naturalWidth,
            height: img.naturalHeight
          };
          
          // Update the main config
          handleConfigChange(`${side}Logo` as any, logoData);
          console.log(`[LOGO] ${side} uploaded and applied to ${selectedBatchIndices.length} selected items.`);
        }
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const removeLogo = (side: 'left' | 'right') => {
    handleConfigChange(`${side}Logo` as any, null);
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    
    // Clone the SVG to remove guides before export
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    // Remove guides if they exist in the clone
    if (!config.showGuides) {
      // Already hidden, do nothing
    } else {
      // Temporarily hide guides for export
      const guides = svgClone.querySelectorAll('rect[fill="none"]');
      guides.forEach(g => g.remove());
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgClone);
    
    // Add name spaces
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fascia.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderBoardToPDF = (doc: jsPDF, item: BoardConfig, dpi: number = 300, scale: number = 1) => {
    const totalWPt = ((unitToPx(item.width + item.bleed * 2, item.unit, dpi) / dpi) * 72) * scale;
    const totalHPt = ((unitToPx(item.height + item.bleed * 2, item.unit, dpi) / dpi) * 72) * scale;
    const bleedPt = ((unitToPx(item.bleed, item.unit, dpi) / dpi) * 72) * scale;
    
    const isWithLogos = item.layout === 'with-logos';
    const logoSize = item.logoSize || 5;
    const logoWidthPt = ((unitToPx(logoSize, 'cm', dpi) / dpi) * 72) * scale;
    const logoMarginPt = ((unitToPx(2, 'cm', dpi) / dpi) * 72) * scale;
    const logoTopPt = ((unitToPx(item.height / 10, 'cm', dpi) / dpi) * 72) * scale;
    const logoHeightPt = Math.max(0, totalHPt - bleedPt * 2 - logoTopPt * 2);
    
    const logoSafeMarginPt = ((unitToPx(logoSize + 4, 'cm', dpi) / dpi) * 72) * scale;
    const effectiveMarginLeftPt = isWithLogos ? logoSafeMarginPt : ((unitToPx(item.marginLeft, item.unit, dpi) / dpi) * 72) * scale;
    const effectiveMarginRightPt = isWithLogos ? logoSafeMarginPt : ((unitToPx(item.marginRight, item.unit, dpi) / dpi) * 72) * scale;
    const effectiveMarginTopPt = ((unitToPx(item.marginTop, item.unit, dpi) / dpi) * 72) * scale;
    const effectiveMarginBottomPt = ((unitToPx(item.marginBottom, item.unit, dpi) / dpi) * 72) * scale;
    
    const textWidthPt = totalWPt - bleedPt * 2 - effectiveMarginLeftPt - effectiveMarginRightPt;
    const textHeightPt = totalHPt - bleedPt * 2 - effectiveMarginTopPt - effectiveMarginBottomPt;

    // Draw background
    doc.setFillColor(item.backgroundColor);
    doc.rect(0, 0, totalWPt, totalHPt, 'F');
    
    // Draw logos placeholders or actual logos
    if (isWithLogos) {
      const drawLogo = (logo: LogoData | null | undefined, x: number, y: number, w: number, h: number) => {
        if (logo) {
          const imgRatio = logo.width / logo.height;
          const zoneRatio = w / h;
          let drawW = w;
          let drawH = h;
          if (imgRatio > zoneRatio) {
            drawH = w / imgRatio;
          } else {
            drawW = h * imgRatio;
          }
          const drawX = x + (w - drawW) / 2;
          const drawY = y + (h - drawH) / 2;
          
          // Try to extract image type from data URL
          let imgType = 'PNG';
          if (logo.url.startsWith('data:image/jpeg') || logo.url.startsWith('data:image/jpg')) {
            imgType = 'JPEG';
          }
          
          doc.addImage(logo.url, imgType, drawX, drawY, drawW, drawH);
        } else {
          doc.setDrawColor(0, 0, 0);
          doc.setFillColor(0, 0, 0);
          // doc.setGState(new GState({ opacity: 0.05 })); // REMOVED to prevent crashes
          doc.setFillColor(0, 0, 0); // Solid black with low contrast fill
          doc.rect(x, y, w, h, 'F');
          
          doc.setDrawColor(0, 0, 0);
          doc.setLineDashPattern([2 * scale, 2 * scale], 0);
          doc.rect(x, y, w, h, 'S');
          doc.setLineDashPattern([], 0);
          
          doc.setFontSize(((unitToPx(1, 'cm', dpi) / dpi) * 72) * scale);
          doc.setFont(item.fontFamily.split(',')[0].trim().replace(/['"]/g, ''), 'bold');
          doc.text('LOGO', x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
        }
      };

      drawLogo(item.leftLogo, bleedPt + logoMarginPt, bleedPt + logoTopPt, logoWidthPt, logoHeightPt);
      drawLogo(item.rightLogo, totalWPt - bleedPt - logoMarginPt - logoWidthPt, bleedPt + logoTopPt, logoWidthPt, logoHeightPt);
    }

    // Draw text
    doc.setTextColor(item.textColor);
    const isBold = item.fontWeight === 'bold' || Number(item.fontWeight) >= 600;
    const fontName = item.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
    // Fallback to Helvetica for jsPDF rendering, but we'll use Canvas for measurement
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const targetFontSizePt = item.fontSize;
    const targetFontSizePx = targetFontSizePt * (dpi / 72);
    
    let minFontSizePx = 1;
    let maxFontSizePx = targetFontSizePx;
    let currentFontSizePx = targetFontSizePx;
    let lines: string[] = [];
    let totalTextHeightPx = 0;
    
    // Create a hidden canvas for measurements to match BoardPreview
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      // Convert textWidthPt and textHeightPt to pixels for canvas measurement
      const zoneWidthPx = (textWidthPt / 72) * dpi;
      const zoneHeightPx = (textHeightPt / 72) * dpi;

      for (let i = 0; i < 20; i++) { // Binary search for optimal font size
        currentFontSizePx = (minFontSizePx + maxFontSizePx) / 2;
        context.font = `${isBold ? 600 : 400} ${currentFontSizePx}px ${item.fontFamily}`;
        
        lines = [];
        const paragraphs = item.text.split('\n');
        
        for (const paragraph of paragraphs) {
          const words = paragraph.split(' ');
          let currentLine = words[0] || '';
          for (let j = 1; j < words.length; j++) {
            const word = words[j];
            const w = context.measureText(currentLine + ' ' + word).width;
            if (w <= zoneWidthPx) {
              currentLine += ' ' + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine); // Add the last line of the paragraph
        }
        
        totalTextHeightPx = lines.length * (currentFontSizePx * 1.2); // 1.2 is a common line height factor
        
        // Check if it fits
        let lineOverflow = false;
        for (const line of lines) {
           if (context.measureText(line).width > zoneWidthPx) {
             lineOverflow = true;
             break;
           }
        }

        if (totalTextHeightPx > zoneHeightPx || lineOverflow) {
          maxFontSizePx = currentFontSizePx;
        } else {
          minFontSizePx = currentFontSizePx;
        }
      }
      
      const finalFontSizePx = minFontSizePx;
      const finalFontSizePt = (finalFontSizePx / dpi) * 72;
      doc.setFontSize(finalFontSizePt);
      
      // Final split using jsPDF with computed size
      // jsPDF's splitTextToSize uses its own font metrics, which might differ slightly from canvas.
      // However, the canvas measurement gives us a good approximation for the max font size.
      lines = doc.splitTextToSize(item.text, textWidthPt);
      const finalLineHeightPt = finalFontSizePt * 1.2;
      const finalTotalH = lines.length * finalLineHeightPt;
      
      // Calculate starting Y position based on vertical alignment
      let startY = bleedPt + effectiveMarginTopPt + finalFontSizePt; // Baseline for the first line
      if (item.verticalAlign === 'center') {
        startY = bleedPt + effectiveMarginTopPt + (textHeightPt - finalTotalH) / 2 + finalFontSizePt;
      } else if (item.verticalAlign === 'bottom') {
        startY = bleedPt + effectiveMarginTopPt + textHeightPt - finalTotalH + finalFontSizePt;
      }

      // Calculate X position based on alignment
      let startX = bleedPt + effectiveMarginLeftPt;
      let align: 'left' | 'center' | 'right' = 'left';
      if (item.textAlign === 'center') {
        startX += textWidthPt / 2;
        align = 'center';
      } else if (item.textAlign === 'right') {
        startX += textWidthPt;
        align = 'right';
      }

      doc.text(lines, startX, startY, {
        align,
        baseline: 'bottom', // jsPDF's default baseline for text() is 'alphabetic', 'bottom' aligns to the bottom of the text block
        lineHeightFactor: 1.2
      });
    }
  };

  const exportPDF = () => {
    if (!svgRef.current) return;
    
    const dpi = 300;
    const totalWPt = (unitToPx(config.width + config.bleed * 2, config.unit, dpi) / dpi) * 72;
    const totalHPt = (unitToPx(config.height + config.bleed * 2, config.unit, dpi) / dpi) * 72;
    
    const orientation = totalWPt > totalHPt ? 'l' : 'p';
    const doc = new jsPDF({
      orientation,
      unit: 'pt',
      format: [totalWPt, totalHPt]
    });

    renderBoardToPDF(doc, config, dpi, 1);
    
    doc.save(`${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fascia.pdf`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same file can be selected again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // Read as array of arrays to find the header row
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      let headerRowIndex = -1;
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        if (Array.isArray(row) && row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('company name'))) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex !== -1) {
        const headers = (rawData[headerRowIndex] as any[]).map(h => String(h || '').trim().toLowerCase());
        const companyIdx = headers.findIndex(h => h.includes('company'));
        const dimIdx = headers.findIndex(h => h.includes('dimension') || h.includes('size'));
        const copiesIdx = headers.findIndex(h => h.includes('cop'));

        const parsedData: BatchItem[] = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (!row || row.length === 0) continue;
          
          const companyName = row[companyIdx];
          if (!companyName) continue; // Skip empty rows
          
          let width = config.width;
          let height = config.height;
          
          if (dimIdx !== -1 && row[dimIdx]) {
            const dimStr = String(row[dimIdx]);
            // Parse "300x25" or "300 x 25" or "300*25"
            const match = dimStr.match(/(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)/);
            if (match) {
              width = Number(match[1]);
              height = Number(match[2]);
            }
          }
          
          const copies = copiesIdx !== -1 ? Number(row[copiesIdx]) || 1 : 1;
          
          parsedData.push({
            ...config,
            companyName: String(companyName),
            text: String(companyName),
            width,
            height,
            copies
          });
        }
        setBatchData(parsedData);
        setMode('batch');
      } else {
        // Fallback to basic parsing if header not found
        const data = XLSX.utils.sheet_to_json(ws);
        const parsedData: BatchItem[] = data.map((row: any) => {
          const companyName = row['Company Name'] || row['Name'] || row['Document Name'] || Object.values(row)[0] || 'UNKNOWN';
          return {
            ...config,
            companyName: String(companyName),
            text: String(companyName),
            width: Number(row['Width']) || config.width,
            height: Number(row['Height']) || config.height,
            copies: Number(row['Copies']) || 1,
          };
        });
        setBatchData(parsedData);
        setMode('batch');
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportBatch = () => {
    if (batchData.length === 0) return;
    setShowConfirmDialog(true);
  };

  const confirmExportBatch = () => {
    setShowConfirmDialog(false);
    if (batchData.length === 0) return;
    
    const dpi = 300;
    let doc: jsPDF | null = null;
    
    batchData.forEach((item) => {
      for (let i = 0; i < item.copies; i++) {
        const totalWPt = (unitToPx(item.width + item.bleed * 2, item.unit, dpi) / dpi) * 72;
        const totalHPt = (unitToPx(item.height + item.bleed * 2, item.unit, dpi) / dpi) * 72;
        
        const orientation = totalWPt > totalHPt ? 'l' : 'p';
        
        if (!doc) {
          doc = new jsPDF({
            orientation,
            unit: 'pt',
            format: [totalWPt, totalHPt]
          });
        } else {
          doc.addPage([totalWPt, totalHPt], orientation);
        }

        renderBoardToPDF(doc, item, dpi);
      }
    });
    
    if (doc) {
      doc.save(`${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_batch.pdf`);
    }
  };

  const exportZIP = async () => {
    if (batchData.length === 0) return;
    
    const zip = new JSZip();
    const dpi = 300;
    
    for (let i = 0; i < batchData.length; i++) {
      const item = batchData[i];
      const totalWPt = (unitToPx(item.width + item.bleed * 2, item.unit, dpi) / dpi) * 72;
      const totalHPt = (unitToPx(item.height + item.bleed * 2, item.unit, dpi) / dpi) * 72;
      const orientation = totalWPt > totalHPt ? 'l' : 'p';
      
      const doc = new jsPDF({
        orientation,
        unit: 'pt',
        format: [totalWPt, totalHPt]
      });
      
      renderBoardToPDF(doc, item, dpi);
      
      const pdfBlob = doc.output('blob');
      const safeName = item.companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      if (item.copies > 1) {
        for (let c = 1; c <= item.copies; c++) {
          zip.file(`${safeName}_copy${c}.pdf`, pdfBlob);
        }
      } else {
        zip.file(`${safeName}.pdf`, pdfBlob);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_boards.zip`);
  };

  const handleAddBatchItemAndSwitchMode = () => {
    handleAddBatchItem();
    setMode('batch');
  };

  const exportTiledPDF = (tileWidthCm: number) => {
    if (batchData.length === 0) return;
    
    const dpi = 300;
    const numCols = tileWidthCm === 120 ? 4 : 6;
    const totalBatchCopies = batchData.reduce((sum, item) => sum + item.copies, 0);
    
    const normalizeToCm = (val: number, unit: Unit) => {
      if (unit === 'cm') return val;
      if (unit === 'mm') return val / 10;
      if (unit === 'in') return val * 2.54;
      return val;
    };

    // 1. Expand batchData into a flat list of boards
    const flatBoards: BatchItem[] = [];
    batchData.forEach(item => {
      for (let i = 0; i < item.copies; i++) {
        flatBoards.push(item);
      }
    });

    // 2. Group into rows and calculate per-row max width (which becomes row height after rotation)
    const rows: { boards: BatchItem[], maxBoardWidth: number }[] = [];
    for (let i = 0; i < flatBoards.length; i += numCols) {
      const rowBoards = flatBoards.slice(i, i + numCols);
      const maxW = Math.max(...rowBoards.map(d => normalizeToCm(d.width, d.unit)));
      rows.push({ boards: rowBoards, maxBoardWidth: maxW });
    }

    // 3. Calculate total tile height
    const totalTileHeightCm = rows.reduce((sum, row) => sum + row.maxBoardWidth, 0);
    
    // Physical dimensions in PT
    const physicalWidthPt = (unitToPx(tileWidthCm, 'cm', dpi) / dpi) * 72;
    const physicalHeightPt = (unitToPx(totalTileHeightCm, 'cm', dpi) / dpi) * 72;
    
    const SAFE_LIMIT = 10000;
    let userUnit = 1.0;
    if (physicalHeightPt > SAFE_LIMIT || physicalWidthPt > SAFE_LIMIT) {
      userUnit = Math.ceil(Math.max(physicalHeightPt, physicalWidthPt) / SAFE_LIMIT);
    }

    const logicalWidthPt = physicalWidthPt / userUnit;
    const logicalHeightPt = physicalHeightPt / userUnit;

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: [logicalWidthPt, logicalHeightPt],
      userUnit: userUnit
    });

    let cumulativeHeightCm = 0;

    rows.forEach((row) => {
      const rowBoards = row.boards;
      const rowHeightCm = row.maxBoardWidth;
      
      rowBoards.forEach((item, colIdx) => {
        const boardHeightCm = normalizeToCm(item.height, item.unit);
        
        // Horizontal distribution
        let posXCm = 0;
        const totalGaps = numCols - 1;
        const totalBoardsWidth = numCols * boardHeightCm;
        const gapSize = Math.max(0, (tileWidthCm - totalBoardsWidth) / totalGaps);
        posXCm = colIdx * (boardHeightCm + gapSize);
        
        const posXPt = ((unitToPx(posXCm, 'cm', dpi) / dpi) * 72) / userUnit;
        const posYPt = ((unitToPx(cumulativeHeightCm, 'cm', dpi) / dpi) * 72) / userUnit;
        
        const itemHUnits = item.height + item.bleed * 2;
        const itemHPtLogical = ((unitToPx(itemHUnits, item.unit, dpi) / dpi) * 72) / userUnit;
        const itemWUnits = item.width + item.bleed * 2;
        const itemWPtLogical = ((unitToPx(itemWUnits, item.unit, dpi) / dpi) * 72) / userUnit;

        (doc as any).saveGraphicsState();
        
        // Logical Matrix: Rotation 90 CW + Translation
        // Content inside renderBoardToPDF will be manually scaled by 1/userUnit
        (doc as any).setCurrentTransformationMatrix(0, 1, -1, 0, posXPt + itemHPtLogical, posYPt);
        
        renderBoardToPDF(doc, item, dpi, 1 / userUnit);
        
        // Draw cut lines (logical units)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(2 / userUnit);
        doc.rect(0, 0, itemHPtLogical, itemWPtLogical, 'S');
        
        (doc as any).restoreGraphicsState();
      });

      cumulativeHeightCm += rowHeightCm;
    });

    doc.save(`${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tile_${tileWidthCm}cm.pdf`);
    setShowTilingModal(false);
  };

  const exportTiledZIP = async (tileWidthCm: number) => {
    if (batchData.length === 0) return;
    
    const dpi = 300;
    const numCols = tileWidthCm === 120 ? 4 : 6;
    const MAX_STRIP_HEIGHT_CM = 200;
    
    const normalizeToCm = (val: number, unit: Unit) => {
      if (unit === 'cm') return val;
      if (unit === 'mm') return val / 10;
      if (unit === 'in') return val * 2.54;
      return val;
    };

    const flatBoards: BatchItem[] = [];
    batchData.forEach(item => {
      for (let i = 0; i < item.copies; i++) {
        flatBoards.push(item);
      }
    });

    const rows: { boards: BatchItem[], maxBoardWidth: number }[] = [];
    for (let i = 0; i < flatBoards.length; i += numCols) {
      const rowBoards = flatBoards.slice(i, i + numCols);
      const maxW = Math.max(...rowBoards.map(d => normalizeToCm(d.width, d.unit)));
      rows.push({ boards: rowBoards, maxBoardWidth: maxW });
    }

    const zip = new JSZip();
    const folder = zip.folder("fascia_tiles");

    let currentStripRows: typeof rows = [];
    let currentStripHeightCm = 0;
    let stripIndex = 1;

    const processStrip = async (stripRows: typeof rows, stripH: number, index: number) => {
      const physicalWidthPt = (unitToPx(tileWidthCm, 'cm', dpi) / dpi) * 72;
      const physicalHeightPt = (unitToPx(stripH, 'cm', dpi) / dpi) * 72;

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: [physicalWidthPt, physicalHeightPt]
      });

      let yOffsetCm = 0;
      for (const row of stripRows) {
        const rowHeightCm = row.maxBoardWidth;
        
        row.boards.forEach((item, colIdx) => {
          const boardHeightCm = normalizeToCm(item.height, item.unit);
          const totalGaps = numCols - 1;
          const totalBoardsWidth = numCols * boardHeightCm;
          const gapSize = Math.max(0, (tileWidthCm - totalBoardsWidth) / totalGaps);
          const posXCm = colIdx * (boardHeightCm + gapSize);
          
          const posXPt = (unitToPx(posXCm, 'cm', dpi) / dpi) * 72;
          const posYPt = (unitToPx(yOffsetCm, 'cm', dpi) / dpi) * 72;
          
          const itemHPt = (unitToPx(item.height + item.bleed * 2, item.unit, dpi) / dpi) * 72;
          const itemWPt = (unitToPx(item.width + item.bleed * 2, item.unit, dpi) / dpi) * 72;

          (doc as any).saveGraphicsState();
          (doc as any).setCurrentTransformationMatrix(0, 1, -1, 0, posXPt + itemHPt, posYPt);
          renderBoardToPDF(doc, item, dpi, 1);
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(2);
          doc.rect(0, 0, itemWPt, itemHPt, 'S');
          (doc as any).restoreGraphicsState();
        });
        
        yOffsetCm += rowHeightCm;
      }

      const pdfBlob = doc.output('blob');
      folder?.file(`strip_${String(index).padStart(2, '0')}_height_${Math.round(stripH)}cm.pdf`, pdfBlob);
    };

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rowHeightCm = row.maxBoardWidth;

      // If adding this row exceeds the limit, process the current strip and start a new one
      if (currentStripHeightCm + rowHeightCm > MAX_STRIP_HEIGHT_CM && currentStripRows.length > 0) {
        await processStrip(currentStripRows, currentStripHeightCm, stripIndex++);
        currentStripRows = [];
        currentStripHeightCm = 0;
      }

      currentStripRows.push(row);
      currentStripHeightCm += rowHeightCm;
    }

    // Process the final strip
    if (currentStripRows.length > 0) {
      await processStrip(currentStripRows, currentStripHeightCm, stripIndex);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    saveAs(zipContent, `${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tiles_pdf.zip`);
    setShowTilingModal(false);
  };

  const exportTiledTIFF = async (tileWidthCm: number) => {
    if (batchData.length === 0) return;
    
    // Wait for fonts to be ready before drawing on canvas
    await document.fonts.ready;
    
    // We'll use 100 DPI for TIFF as requested
    const exportDpi = 100;
    const numCols = tileWidthCm === 120 ? 4 : 6;
    
    const normalizeToCm = (val: number, unit: Unit) => {
      if (unit === 'cm') return val;
      if (unit === 'mm') return val / 10;
      if (unit === 'in') return val * 2.54;
      return val;
    };

    const flatBoards: BatchItem[] = [];
    batchData.forEach(item => {
      for (let i = 0; i < item.copies; i++) {
        flatBoards.push(item);
      }
    });

    const rows: { boards: BatchItem[], maxBoardWidth: number }[] = [];
    for (let i = 0; i < flatBoards.length; i += numCols) {
      const rowBoards = flatBoards.slice(i, i + numCols);
      const maxW = Math.max(...rowBoards.map(d => normalizeToCm(d.width, d.unit)));
      rows.push({ boards: rowBoards, maxBoardWidth: maxW });
    }

    const totalTileHeightCm = rows.reduce((sum, row) => sum + row.maxBoardWidth, 0);
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(unitToPx(tileWidthCm, 'cm', exportDpi));
    canvas.height = Math.round(unitToPx(totalTileHeightCm, 'cm', exportDpi));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let cumulativeHeightCm = 0;
    for (const row of rows) {
      const rowBoards = row.boards;
      const rowHeightCm = row.maxBoardWidth;
      
      rowBoards.forEach((item, colIdx) => {
        const boardHeightCm = normalizeToCm(item.height, item.unit);
        let posXCm = 0;
        const totalGaps = numCols - 1;
        const totalBoardsWidth = numCols * boardHeightCm;
        const gapSize = Math.max(0, (tileWidthCm - totalBoardsWidth) / totalGaps);
        posXCm = colIdx * (boardHeightCm + gapSize);

        const xPx = unitToPx(posXCm, 'cm', exportDpi);
        const yPx = unitToPx(cumulativeHeightCm, 'cm', exportDpi);
        const wPx = unitToPx(item.width + item.bleed * 2, item.unit, exportDpi);
        const hPx = unitToPx(item.height + item.bleed * 2, item.unit, exportDpi);

        ctx.save();
        ctx.translate(xPx + hPx, yPx);
        ctx.rotate(Math.PI / 2);

        // Simple board rendering for canvas
        ctx.fillStyle = item.backgroundColor;
        ctx.fillRect(0, 0, wPx, hPx);

        // Render Logos
        const isWithLogos = item.layout === 'with-logos';
        const currentLogoSize = item.logoSize || 5;
        const logoWidthPx = unitToPx(currentLogoSize, 'cm', exportDpi);
        const logoMarginPx = unitToPx(2, 'cm', exportDpi);
        const logoTopPx = unitToPx(item.height / 10, 'cm', exportDpi);
        const logoHeightPx = Math.max(0, hPx - logoTopPx * 2);

        if (isWithLogos) {
          const drawLogoCanvasSync = (logo: LogoData | null | undefined, x: number, y: number, w: number, h: number) => {
            if (logo) {
              const img = document.querySelector(`img[src="${logo.url}"]`) as HTMLImageElement || new Image();
              if (!img.src) img.src = logo.url;
              
              const imgRatio = logo.width / logo.height;
              const zoneRatio = w / h;
              let drawW = w;
              let drawH = h;
              if (imgRatio > zoneRatio) {
                drawH = w / imgRatio;
              } else {
                drawW = h * imgRatio;
              }
              const drawX = x + (w - drawW) / 2;
              const drawY = y + (h - drawH) / 2;
              try {
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
              } catch (e) {
                // Fallback if image not ready
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x, y, w, h);
              }
            } else {
              ctx.fillStyle = 'rgba(0,0,0,0.05)';
              ctx.fillRect(x, y, w, h);
              ctx.strokeStyle = 'rgba(0,0,0,0.15)';
              ctx.strokeRect(x, y, w, h);
            }
          };

          drawLogoCanvasSync(item.leftLogo, logoMarginPx, logoTopPx, logoWidthPx, logoHeightPx);
          drawLogoCanvasSync(item.rightLogo, wPx - logoMarginPx - logoWidthPx, logoTopPx, logoWidthPx, logoHeightPx);
        }

        // Text
        const logoSafeMarginPx = unitToPx(isWithLogos ? currentLogoSize + 4 : (item.marginLeft || 5), 'cm', exportDpi);
        const textWidthPx = wPx - (isWithLogos ? logoSafeMarginPx * 2 : (unitToPx(item.marginLeft, 'cm', exportDpi) + unitToPx(item.marginRight, 'cm', exportDpi)));

        ctx.fillStyle = item.textColor;
        const isBold = item.fontWeight === 'bold' || Number(item.fontWeight) >= 600;
        const fontName = item.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        const fontSizePx = (item.fontSize / 72) * exportDpi;
        
        ctx.font = `${isBold ? '600' : '400'} ${Math.round(fontSizePx)}px ${fontName}`;
        ctx.textAlign = item.textAlign as CanvasTextAlign;
        ctx.textBaseline = 'middle';
        
        let tx = isWithLogos ? logoSafeMarginPx : unitToPx(item.marginLeft, 'cm', exportDpi);
        if (item.textAlign === 'center') tx = (isWithLogos ? logoSafeMarginPx : unitToPx(item.marginLeft, 'cm', exportDpi)) + textWidthPx / 2;
        else if (item.textAlign === 'right') tx = (isWithLogos ? logoSafeMarginPx : unitToPx(item.marginLeft, 'cm', exportDpi)) + textWidthPx;
        
        ctx.fillText(item.text, tx, hPx / 2);

        // Outlines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1; 
        ctx.strokeRect(0, 0, wPx, hPx);

        ctx.restore();
      });
      cumulativeHeightCm += rowHeightCm;
    }

    // Convert to TIFF using UTIF.js
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Cast to any to avoid Uint8ClampedArray vs Uint8Array mismatch in some environments
    const tiffBuffer = (UTIF as any).encodeImage(imgData, canvas.width, canvas.height);
    const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
    saveAs(blob, `${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tile.tiff`);
    setShowTilingModal(false);
  };

  const exportJSON = (tileWidthCm: number) => {
    if (batchData.length === 0) return;

    console.log(`[BRIDGE] Starting export for ${batchData.length} boards...`);

    // Optimization: Collect unique logos to avoid massive redundant JSON data
    const logoMap = new Map<string, string>();
    const assets: Record<string, { url: string }> = {};
    let logoCounter = 0;

    const processedBoards = batchData.map((board, index) => {
      const newBoard = { ...board } as any;
      
      // Ensure we check for actual data in leftLogo
      if (board.leftLogo && board.leftLogo.url && board.leftLogo.url.startsWith('data:')) {
        if (!logoMap.has(board.leftLogo.url)) {
          const id = `logo_${++logoCounter}`;
          logoMap.set(board.leftLogo.url, id);
          assets[id] = { url: board.leftLogo.url };
          console.log(`[BRIDGE] Captured new left logo for board ${index}: ${id}`);
        }
        newBoard.leftLogoId = logoMap.get(board.leftLogo.url);
        delete newBoard.leftLogo;
      } else if (board.layout === 'with-logos') {
        console.warn(`[BRIDGE] Board ${index} has 'with-logos' layout but leftLogo is missing or invalid.`);
      }
      
      if (board.rightLogo && board.rightLogo.url && board.rightLogo.url.startsWith('data:')) {
        if (!logoMap.has(board.rightLogo.url)) {
          const id = `logo_${++logoCounter}`;
          logoMap.set(board.rightLogo.url, id);
          assets[id] = { url: board.rightLogo.url };
          console.log(`[BRIDGE] Captured new right logo for board ${index}: ${id}`);
        }
        newBoard.rightLogoId = logoMap.get(board.rightLogo.url);
        delete newBoard.rightLogo;
      }
      
      return newBoard;
    });

    const data = {
      version: "1.2.8",
      productionName,
      tileWidthCm: tileWidthCm,
      exportTimestamp: new Date().toISOString(),
      assets,
      boards: processedBoards
    };

    const fileName = `${productionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${tileWidthCm}cm_${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, fileName);
    
    console.log(`[BRIDGE] Export complete. ${logoCounter} unique logos found.`);
    console.log(`%c [BRIDGE EXPORT] %c Data saved to ${fileName}`, 'background: #4f46e5; color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 3px;', 'color: #4f46e5; font-weight: bold;');
    console.log('%c TIP: Save the JSON to your "Downloads" folder to prevent the app from reloading.', 'color: #f59e0b; font-style: italic;');
  };

  if (setupMode) {
    return (
      <div className="fixed inset-0 z-[9999] w-screen h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
        <div className="w-20 h-20 mb-6 drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <img src={logo} alt="FBoard Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-5xl font-black text-neutral-900 mb-2 tracking-tighter">
          FBoard
        </h1>
        <p className="text-neutral-500 mb-12">Choose your fascia layout to get started</p>

        {/* Exit Button */}
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-neutral-900 transition-all shadow-sm hover:shadow-md group active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Exit to Tickel</span>
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Text Only Option */}
          <button 
            onClick={() => {
              handleConfigChange('layout', 'text-only');
              setSetupMode(false);
            }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 hover:shadow-md hover:border-indigo-200 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
              <Type className="w-6 h-6" />
            </div>
            <div className="w-full h-20 border-2 border-dashed border-indigo-100 rounded-xl bg-indigo-50/30 flex items-center justify-center mb-6">
              <span className="text-indigo-400 font-bold text-sm">Company Name</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Text Only</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Full-width text across the fascia board with customisable margins, font, size and colour.
            </p>
          </button>

          {/* With Logos Option */}
          <button 
            onClick={() => {
              handleConfigChange('layout', 'with-logos');
              setSetupMode(false);
            }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 hover:shadow-md hover:border-cyan-200 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-500 mb-6 group-hover:scale-110 transition-transform">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div className="w-full h-20 border-2 border-dashed border-cyan-100 rounded-xl bg-cyan-50/30 flex items-center justify-between px-3 mb-6">
              <div className="w-10 h-10 bg-cyan-100/50 rounded flex items-center justify-center text-[8px] font-bold text-cyan-600">LOGO</div>
              <span className="text-cyan-500 font-bold text-sm">Company Name</span>
              <div className="w-10 h-10 bg-cyan-100/50 rounded flex items-center justify-center text-[8px] font-bold text-cyan-600">LOGO</div>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">With Logos</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Logo placeholders left & right. Each starts at 5cm from edge, max 5cm wide. Text fits between the logo zones.
            </p>
          </button>
        </div>
        
        <p className="text-xs text-neutral-400 mt-12">
          You can mix modes — add boards of either type at any time
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col h-screen w-screen bg-neutral-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSetupMode(true)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 flex items-center gap-2 group"
            title="Back to Hub"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-tight">Hub</span>
          </button>
          
          <div className="h-8 w-px bg-neutral-200 mx-2"></div>
          
          <img src={logo} alt="FBoard" className="w-8 h-8 object-contain" />
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight leading-tight">FBoard</h1>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest -mt-0.5">by Rickel Industries</p>
          </div>
          <div className="h-8 w-px bg-neutral-200 mx-3"></div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Production Name</label>
            <input
              type="text"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
              placeholder="e.g. Summer Festival 2026"
              className="text-sm text-neutral-900 bg-transparent border-none focus:ring-0 p-0 w-64 outline-none placeholder:text-neutral-400 font-bold -mt-1"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-500 font-medium">
            <span className="text-neutral-900 font-bold">{batchData.length > 0 ? batchData.length : 1}</span> boards &bull; <span className="text-neutral-900 font-bold">{batchData.length > 0 ? batchData.reduce((sum, item) => sum + item.copies, 0) : 1}</span> copies
          </div>
          
          <div className="h-6 w-px bg-neutral-200 mx-2"></div>
          
          <button onClick={handleAddBatchItemAndSwitchMode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
          
          <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer mb-0">
            <FileUp className="w-4 h-4" /> Import
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <button onClick={exportBatch} disabled={batchData.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Project PDF
          </button>
          
          <button onClick={() => setShowTilingModal(true)} disabled={batchData.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Grid2X2 className="w-4 h-4" /> Tiling
          </button>
          
          <button onClick={exportZIP} disabled={batchData.length === 0} className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Export ZIP
          </button>

          <button 
            onClick={() => isAdmin ? setShowVectorStudio(true) : setShowStudioLock(true)} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 border border-transparent rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Monitor className="w-4 h-4" /> Vector Studio
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-neutral-200 flex flex-col shadow-sm z-10">
          {/* Mode Toggle */}
          <div className="flex p-4 border-b border-neutral-100 bg-neutral-50/50">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'single' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => setMode('single')}
          >
            {selectedBatchIndices.length > 1 ? `Batch Editor (${selectedBatchIndices.length})` : 'Editor'}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'batch' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => setMode('batch')}
          >
            {batchData.length > 0 ? `Boards (${batchData.length})` : 'Boards'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {mode === 'single' ? (
            <>
              {/* Dimensions Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-neutral-900 font-medium">
                  <Settings className="w-4 h-4" />
                  <h2>Dimensions</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Width</label>
                    <input
                      type="number"
                      value={config.width}
                      onChange={(e) => handleConfigChange('width', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Height</label>
                    <input
                      type="number"
                      value={config.height}
                      onChange={(e) => handleConfigChange('height', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Unit</label>
                  <select
                    value={config.unit}
                    onChange={(e) => handleConfigChange('unit', e.target.value as Unit)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                  >
                    <option value="mm">Millimeters (mm)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="in">Inches (in)</option>
                  </select>
                </div>
              </section>

              {/* Print Setup Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-neutral-900 font-medium">
                  <Layers className="w-4 h-4" />
                  <h2>Print Setup</h2>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Bleed ({config.unit})</label>
                  <input
                    type="number"
                    value={config.bleed}
                    onChange={(e) => handleConfigChange('bleed', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">Margins ({config.unit})</label>
                    <button
                      onClick={() => handleConfigChange('marginLinked', !config.marginLinked)}
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      {config.marginLinked ? (
                        <><Link className="w-3 h-3" /> Linked</>
                      ) : (
                        <><Unlink className="w-3 h-3" /> Free</>
                      )}
                    </button>
                  </div>
                  
                  {config.marginLinked ? (
                    <div>
                      <input
                        type="number"
                        value={config.marginTop}
                        onChange={(e) => handleMarginChange('marginTop', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-medium text-neutral-400 mb-1">Top</label>
                        <input
                          type="number"
                          value={config.marginTop}
                          onChange={(e) => handleMarginChange('marginTop', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-neutral-400 mb-1">Right</label>
                        <input
                          type="number"
                          value={config.marginRight}
                          onChange={(e) => handleMarginChange('marginRight', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-neutral-400 mb-1">Bottom</label>
                        <input
                          type="number"
                          value={config.marginBottom}
                          onChange={(e) => handleMarginChange('marginBottom', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-neutral-400 mb-1">Left</label>
                        <input
                          type="number"
                          value={config.marginLeft}
                          onChange={(e) => handleMarginChange('marginLeft', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={config.showGuides}
                    onChange={(e) => handleConfigChange('showGuides', e.target.checked)}
                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-neutral-700">Show print guides in preview</span>
                </label>
              </section>

              {/* Logos Section */}
              {((config.layout === 'with-logos') ||
                (selectedBatchIndices.some(idx => batchData[idx].layout === 'with-logos'))) && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-900 font-medium">
                    <ImageIcon className="w-4 h-4" />
                    <h2>Logos</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Logo */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Left Logo</label>
                      {config.leftLogo ? (
                        <div className="relative group rounded-lg border border-neutral-200 bg-neutral-50 p-2 flex flex-col items-center">
                          <img src={config.leftLogo.url} alt="Left Logo" className="h-12 object-contain mb-2" />
                          <button onClick={() => removeLogo('left')} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors">
                          <FileUp className="w-4 h-4 text-neutral-400 mb-1" />
                          <span className="text-xs text-neutral-500 font-medium">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('left', e)} />
                        </label>
                      )}
                    </div>
                    {/* Right Logo */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Right Logo</label>
                      {config.rightLogo ? (
                        <div className="relative group rounded-lg border border-neutral-200 bg-neutral-50 p-2 flex flex-col items-center">
                          <img src={config.rightLogo.url} alt="Right Logo" className="h-12 object-contain mb-2" />
                          <button onClick={() => removeLogo('right')} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors">
                          <FileUp className="w-4 h-4 text-neutral-400 mb-1" />
                          <span className="text-xs text-neutral-500 font-medium">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('right', e)} />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {/* Logo Size Control */}
                  <div className="pt-2">
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Logo Size (Height)</label>
                      <span className="text-xs font-bold text-indigo-600">{config.logoSize}cm</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="15" 
                      step="0.5"
                      value={config.logoSize}
                      onChange={(e) => handleConfigChange('logoSize', Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-400 mt-1">
                      <span>Small</span>
                      <span>Large (auto-margins)</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Content Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-900 font-medium">
                    <Type className="w-4 h-4" />
                    <h2>Typography</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                      <button
                        onClick={() => handleConfigChange('textAlign', 'left')}
                        className={`p-1.5 rounded-md transition-colors ${config.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleConfigChange('textAlign', 'center')}
                        className={`p-1.5 rounded-md transition-colors ${config.textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleConfigChange('textAlign', 'right')}
                        className={`p-1.5 rounded-md transition-colors ${config.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                      <button
                        onClick={() => handleConfigChange('verticalAlign', 'top')}
                        className={`p-1.5 rounded-md transition-colors ${config.verticalAlign === 'top' ? 'bg-white shadow-sm text-indigo-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        title="Align Top"
                      >
                        <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleConfigChange('verticalAlign', 'center')}
                        className={`p-1.5 rounded-md transition-colors ${config.verticalAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        title="Align Middle"
                      >
                        <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleConfigChange('verticalAlign', 'bottom')}
                        className={`p-1.5 rounded-md transition-colors ${config.verticalAlign === 'bottom' ? 'bg-white shadow-sm text-indigo-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        title="Align Bottom"
                      >
                        <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Text</label>
                  <textarea
                    value={config.text}
                    onChange={(e) => handleConfigChange('text', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Size (pt)</label>
                    <input
                      type="number"
                      value={config.fontSize}
                      onChange={(e) => handleConfigChange('fontSize', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Font</label>
                    <select
                      value={config.fontFamily}
                      onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
                      <option value="'Montserrat', sans-serif">Montserrat</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="Impact, sans-serif">Impact</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Weight</label>
                    <select
                      value={config.fontWeight}
                      onChange={(e) => handleConfigChange('fontWeight', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-neutral-900"
                    >
                      <option value="normal">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-Bold</option>
                      <option value="bold">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Colors Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-neutral-900 font-medium">
                  <Palette className="w-4 h-4" />
                  <h2>Colors</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Background</label>
                    <ColorPicker
                      color={config.backgroundColor}
                      onChange={(c) => handleConfigChange('backgroundColor', c)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Text</label>
                    <ColorPicker
                      color={config.textColor}
                      onChange={(c) => handleConfigChange('textColor', c)}
                    />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-neutral-900">Loaded Records ({batchData.length})</h3>
                  {batchData.length > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-xs text-neutral-400">Select items to batch edit</span>
                  <button
                    onClick={() => setShowTilingView(!showTilingView)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      showTilingView 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    <Grid2X2 className="w-3.5 h-3.5" />
                    {showTilingView ? 'Tiling Mode On' : 'Tiled Preview'}
                  </button>
                  {showTilingView && (
                    <select 
                      value={tilingViewWidth}
                      onChange={(e) => setTilingViewWidth(Number(e.target.value) as 120 | 150)}
                      className="text-xs border border-neutral-200 bg-white rounded px-2 py-1 outline-none text-neutral-900"
                    >
                      <option value={120}>120cm Tile</option>
                      <option value={150}>150cm Tile</option>
                    </select>
                  )}
                  <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={selectedBatchIndices.length === batchData.length && batchData.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    Multi-Select Mode
                  </label>
                </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {batchData.length > 0 && (
                    <button 
                      onClick={() => {
                        setBatchData([]);
                        setSelectedBatchIndices([]);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium ml-2"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {batchData.length > 0 && (
                <div className="space-y-3">
                  <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded-md bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-3 py-2 font-medium text-neutral-500">Name</th>
                          <th className="px-3 py-2 font-medium text-neutral-500 w-16">W</th>
                          <th className="px-3 py-2 font-medium text-neutral-500 w-16">H</th>
                          <th className="px-3 py-2 font-medium text-neutral-500 w-16">Qty</th>
                          <th className="px-3 py-2 font-medium text-neutral-500 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {batchData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-1 py-1">
                              <input type="text" value={item.companyName} onChange={e => handleUpdateBatchItem(idx, 'companyName', e.target.value)} className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-neutral-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all text-neutral-900" />
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" value={item.width} onChange={e => handleUpdateBatchItem(idx, 'width', Number(e.target.value))} className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-neutral-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all text-neutral-900" />
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" value={item.height} onChange={e => handleUpdateBatchItem(idx, 'height', Number(e.target.value))} className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-neutral-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all text-neutral-900" />
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" value={item.copies} onChange={e => handleUpdateBatchItem(idx, 'copies', Number(e.target.value))} className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-neutral-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all text-neutral-900" />
                            </td>
                            <td className="px-1 py-1 text-center">
                              <button onClick={() => handleRemoveBatchItem(idx)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Actions (Single Mode Only) */}
        {mode === 'single' && selectedBatchIndices.length === 0 && (
          <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-3">
            <button
              onClick={exportPDF}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Single PDF
            </button>
            <button
              onClick={exportSVG}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Single SVG
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-neutral-200 flex items-center px-8 justify-between shrink-0">
          {mode === 'single' && selectedBatchIndices.length === 0 ? (
            <>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-medium text-neutral-600">Bleed Edge</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                  <span className="text-xs font-medium text-neutral-600">Trim Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-neutral-600">Safe Zone (Margin)</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowTilingView(!showTilingView)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    showTilingView 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  <Grid2X2 className="w-3.5 h-3.5" />
                  {showTilingView ? 'Tiling View On' : 'View Tiled Sheet'}
                </button>
                <div className="text-sm text-neutral-500 font-mono">
                  {config.width} x {config.height} {config.unit}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-bold text-neutral-900 uppercase tracking-wide">
                {mode === 'single' ? (selectedBatchIndices.length > 1 ? 'Batch Editor' : 'Editor') : 'All Boards'}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-neutral-400">Select items to batch edit</span>
                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={selectedBatchIndices.length === batchData.length && batchData.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  Multi-Select Mode
                </label>
              </div>
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-12 flex items-center justify-center relative">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* The actual preview */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {showTilingView ? (
              <div className="w-full max-w-4xl max-h-full p-8 animate-in zoom-in-95 duration-500">
                <TiledPreview 
                  batchData={batchData.length > 0 ? (mode === 'single' ? [{ ...config, copies: 1, companyName: config.text }] : batchData) : []} 
                  tileWidthCm={tilingViewWidth} 
                  numCols={tilingViewWidth === 120 ? 4 : 6} 
                />
              </div>
            ) : mode === 'single' && selectedBatchIndices.length === 0 ? (
              <BoardPreview ref={svgRef} config={config} />
            ) : (
              <div className="w-full h-full overflow-y-auto">
                {batchData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-neutral-400">
                    No boards loaded. Upload an Excel file or add a board manually.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-12 w-full max-w-7xl mx-auto">
                    {batchData.map((item, idx) => {
                      if (mode === 'single' && !selectedBatchIndices.includes(idx)) return null;
                      return (
                        <div key={idx} className={`relative flex flex-col items-center gap-3 bg-white/80 p-6 rounded-xl border shadow-sm backdrop-blur-sm transition-all ${selectedBatchIndices.includes(idx) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-neutral-200 hover:shadow-md'}`}>
                          <div className="absolute top-3 left-3 z-20">
                            <input
                              type="checkbox"
                              checked={selectedBatchIndices.includes(idx)}
                              onChange={() => toggleSelection(idx)}
                              className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateBatchItem(idx, 'layout', item.layout === 'with-logos' ? 'text-only' : 'with-logos')}
                              className="p-1.5 bg-white border border-neutral-200 rounded-md text-neutral-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                              title="Toggle Layout"
                            >
                              {item.layout === 'with-logos' ? <LayoutTemplate className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="w-full h-32 flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-100 p-4">
                            <BoardPreview config={item} />
                          </div>
                          <div className="flex items-center justify-between w-full mt-2 px-2">
                            <p className="text-sm font-bold text-neutral-900 truncate" title={item.companyName}>{item.companyName}</p>
                            <p className="text-xs text-neutral-500 shrink-0 ml-4">{item.width}×{item.height}{item.unit} {item.copies > 1 ? `×${item.copies}` : ''}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Confirm Batch Export</h3>
            <p className="text-sm text-neutral-600 mb-6">
              You are about to generate a single PDF containing <strong>{batchData.reduce((sum, item) => sum + item.copies, 0)}</strong> pages. This process may take a moment depending on the number of boards.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExportBatch}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tiling Modal */}
      {showTilingModal && (
        <TilingModal
          isOpen={showTilingModal}
          onClose={() => setShowTilingModal(false)}
          batchData={batchData}
          onExport={exportTiledPDF}
          onExportZIP={exportTiledZIP}
          onExportTIFF={exportTiledTIFF}
          onExportJSON={exportJSON}
        />
      )}

      {/* Vector Studio Lock/Teaser Modal */}
      {showStudioLock && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 relative group">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>

            <div className="relative p-10 flex flex-col items-center text-center">
              {/* Animated Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-200 animate-bounce-subtle">
                <Monitor className="w-10 h-10" />
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Admin Restricted Zone</span>
              </div>

              <h2 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">Vector Studio</h2>
              
              <div className="space-y-4 mb-10">
                <p className="text-sm font-bold text-neutral-800 leading-relaxed">
                  Vector Studio is currently under development by the engineering team at <span className="text-indigo-600">Rickel Industries</span>.
                </p>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 italic text-neutral-500 text-sm leading-relaxed">
                  "Experience the future of generative vector design: Precision-engineered tools for high-fidelity branding, automated asset variations, and AI-accelerated composition."
                </div>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => setShowStudioLock(false)}
                  className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
                >
                  Acknowledged
                </button>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">Access will be granted to verified administrators soon.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vector Studio Full-screen Modal */}
      {showVectorStudio && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-neutral-900 text-white">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold tracking-tight">Vector Studio <span className="text-neutral-500 font-normal ml-2">by Rickel Industries</span></h2>
            </div>
            <button
              onClick={() => setShowVectorStudio(false)}
              className="px-4 py-1.5 text-xs font-bold bg-white/10 hover:bg-red-500 hover:text-white rounded-full transition-all"
            >
              CLOSE STUDIO
            </button>
          </div>
          <div className="flex-1 w-full relative">
            <iframe
              src="/Vector_Studio.html"
              className="absolute inset-0 w-full h-full border-none"
              title="Vector Studio"
            />
          </div>
        </div>
      )}
    </div>
  );
}
