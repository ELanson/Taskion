import React from 'react';
import { X, Layout, Maximize2, Download } from 'lucide-react';
import { BatchItem } from '../types';
import { TiledPreview } from './TiledPreview';
import logo from '../assets/logo.svg';

interface TilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchData: BatchItem[];
  onExport: (tileWidth: number) => void;
  onExportZIP: (tileWidth: number) => void;
  onExportTIFF: (tileWidth: number) => void;
  onExportJSON: (tileWidth: number) => void;
}

export const TilingModal: React.FC<TilingModalProps> = ({ isOpen, onClose, batchData, onExport, onExportZIP, onExportTIFF, onExportJSON }) => {
  if (!isOpen) return null;

  const totalBoards = batchData.reduce((sum, item) => sum + item.copies, 0);
  
  const calculateTileInfo = (tileWidth: number, boardsPerRow: number) => {
    const numRows = Math.ceil(totalBoards / boardsPerRow);
    // Use the maximum width of boards in the batch as the row height
    const maxWidth = batchData.length > 0 ? Math.max(...batchData.map(d => d.width)) : 300; 
    const totalHeight = numRows * maxWidth;
    return {
      rows: numRows,
      height: totalHeight,
      boardsPerRow
    };
  };

  const tile120 = calculateTileInfo(120, 4);
  const tile150 = calculateTileInfo(150, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <img src={logo} alt="FBoard" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Tiling Setup</h2>
              <p className="text-neutral-500 text-sm mt-1">Export all boards arranged on a single large artboard</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-neutral-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-neutral-900">
            {/* Tile 120 Card */}
            <div className="group relative bg-neutral-50 rounded-2xl p-6 sm:p-8 border-2 border-transparent hover:border-indigo-500 hover:bg-white transition-all shadow-sm hover:shadow-xl">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <Layout className="w-7 h-7" />
                </div>
                <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  4 COLUMNS
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Tile 120cm</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                Best for 1.2m wide rolls. Boards are spaced equally across the width.
              </p>
              
              <div className="space-y-3 bg-white/50 group-hover:bg-neutral-50 p-4 rounded-xl border border-neutral-200 transition-colors">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Resulting Width</span>
                  <span className="font-bold text-neutral-900">120 cm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Resulting Height</span>
                  <span className="font-bold text-indigo-600">{tile120.height} cm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Total Rows</span>
                  <span className="font-bold text-neutral-900">{tile120.rows}</span>
                </div>
              </div>

              <div className="mt-6 mb-6">
                <TiledPreview batchData={batchData} tileWidthCm={120} numCols={4} />
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => onExport(120)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  <Download className="w-5 h-5" />
                  Export One-Click Print
                </button>
                <button 
                  onClick={() => onExportZIP(120)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 text-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                  Export Full Scale PDF (ZIP)
                </button>
                <button 
                  onClick={() => onExportTIFF(120)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors text-sm"
                >
                  <Layout className="w-4 h-4" />
                  Export TIFF Print File
                </button>
                <button 
                  onClick={() => onExportJSON(120)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 text-sm"
                  title="Download JSON for Adobe Illustrator script (120cm)"
                >
                  <Layout className="w-4 h-4" />
                  Ai Bridge Export (120cm)
                </button>
              </div>
            </div>

            {/* Tile 150 Card */}
            <div className="group relative bg-neutral-50 rounded-2xl p-6 sm:p-8 border-2 border-transparent hover:border-cyan-500 hover:bg-white transition-all shadow-sm hover:shadow-xl">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                  <Maximize2 className="w-7 h-7" />
                </div>
                <div className="bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  6 COLUMNS
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Tile 150cm</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                Optimized for 1.5m wide rolls. Boards fit side-by-side with no gaps.
              </p>
              
              <div className="space-y-3 bg-white/50 group-hover:bg-neutral-50 p-4 rounded-xl border border-neutral-200 transition-colors">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Resulting Width</span>
                  <span className="font-bold text-neutral-900">150 cm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Resulting Height</span>
                  <span className="font-bold text-cyan-600">{tile150.height} cm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Total Rows</span>
                  <span className="font-bold text-neutral-900">{tile150.rows}</span>
                </div>
              </div>

              <div className="mt-6 mb-6">
                <TiledPreview batchData={batchData} tileWidthCm={150} numCols={6} />
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => onExport(150)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200"
                >
                  <Download className="w-5 h-5" />
                  Export One-Click Print
                </button>
                <button 
                  onClick={() => onExportZIP(150)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-cyan-50 text-cyan-700 font-bold rounded-xl hover:bg-cyan-100 transition-colors border border-cyan-200 text-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                  Export Full Scale PDF (ZIP)
                </button>
                <button 
                  onClick={() => onExportTIFF(150)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors text-sm"
                >
                  <Layout className="w-4 h-4" />
                  Export TIFF Print File
                </button>
                <button 
                  onClick={() => onExportJSON(150)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 text-sm"
                  title="Download JSON for Adobe Illustrator script (150cm)"
                >
                  <Layout className="w-4 h-4" />
                  Ai Bridge Export (150cm)
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-neutral-50 px-8 py-6 text-center border-t border-neutral-100">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">
            {totalBoards} Total Boards detected in current batch
          </p>
        </div>
      </div>
    </div>
  );
};
